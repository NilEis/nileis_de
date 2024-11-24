#include "backend_shader.h"
#include "log.h"

#include "shader.h"
#include <assert.h>
#include <math.h>
#include <stdarg.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

static int compare_shader_member (const void *a, const void *b)
{
    const shader_data *x = a;
    const shader_data *y = b;
    return strcmp (x->name, y->name);
}

static void shader_manager_sort_data (const shader_manager_struct *manager)
{
    qsort (manager->shader,
        manager->num_shaders,
        sizeof (shader_data),
        compare_shader_member);
}

static shader_data *shader_manager_find_data (
    const shader_manager_struct *manager, const char *name)
{
    assert (manager);
    const shader_data m = { .name = name };
    return bsearch (&m,
        manager->shader,
        manager->num_shaders,
        sizeof (shader_data),
        compare_shader_member);
}

static int shader_manager_insert (
    shader_manager_struct *restrict manager, const shader_data *restrict data)
{
    assert (manager);
    assert (data);
    shader_data *restrict d = realloc (
        manager->shader, (manager->num_shaders + 1) * sizeof (shader_data));
    if (d == NULL)
    {
        return 1;
    }
    manager->shader = d;
    manager->num_shaders++;
    manager->shader[manager->num_shaders - 1] = *data;
    manager->shader[manager->num_shaders - 1].performance.counter = 0;
    manager->shader[manager->num_shaders - 1].performance.time = 0;
    shader_manager_sort_data (manager);
    return 0;
}

int shader_manager_init (
    shader_manager_struct *manager, struct state_struct *state)
{
    manager->num_shaders = 0;
    manager->shader = calloc (1, sizeof (shader_data));
    assert (manager->shader);
    manager->num_shaders = 0;
    manager->state = state;
    return 0;
}
int shader_manager_add_draw_shader (
    shader_manager_struct *manager, const char *name, const GLuint shader)
{
    assert (manager);
    assert (name);
    const shader_data d = { .name = name,
        .type = DRAW_SHADER,
        .shader = shader,
        .draw_shader = { .data = NULL } };
    return shader_manager_insert (manager, &d);
}

int shader_manager_add_compute_shader (shader_manager_struct *manager,
    const char *name,
    const GLuint shader,
    const GLuint x,
    const GLuint y,
    const GLuint z,
    const bool swap_maps)
{
    assert (manager);
    assert (name);
    const shader_data d = {
        .name = name,
        .type = COMPUTE_SHADER,
        .shader = shader,
        .compute_shader = { .swap_maps = swap_maps, .x = x, .y = y, .z = z }
    };
    return shader_manager_insert (manager, &d);
}

extern bool state_swap_textures (state_struct *state, bool current_map_is_a);

int shader_manager_load_program (
    shader_manager_struct *manager, const char *name)
{
    assert (manager);
    assert (name);
    shader_data *d = shader_manager_find_data (manager, name);
    if (d == NULL)
    {
        return 1;
    }
    d->performance.counter++;
    if (d->type == COMPUTE_SHADER)
    {
        const clock_t begin = clock ();
        glBindFramebuffer (GL_FRAMEBUFFER, manager->state->active_framebuffer);
        glUseProgram (d->shader);
        glDispatchCompute (
            d->compute_shader.x, d->compute_shader.y, d->compute_shader.z);
        glMemoryBarrier (GL_SHADER_IMAGE_ACCESS_BARRIER_BIT);
        if (d->compute_shader.swap_maps)
        {
            manager->state->current_map_is_a = state_swap_textures (
                manager->state, manager->state->current_map_is_a);
        }
        const clock_t end = clock ();
        d->performance.time += (end - begin);
    }
    else if (d->type == DRAW_SHADER)
    {
        glUseProgram (d->shader);
    }
    return 0;
}

void shader_manager_free (shader_manager_struct *manager)
{
    assert (manager);
    for (int i = 0; i < manager->num_shaders; i++)
    {
        char *type_name;
        shader_data *d = &manager->shader[i];
        const shader_type type = d->type;
        switch (type)
        {
        case DRAW_SHADER:
            type_name = "shader";
            break;
        case COMPUTE_SHADER:
            type_name = "compute shader";
            break;
        default:
            type_name = "unknown";
            break;
        }
        const long double time = d->performance.time;
        const long double counter = d->performance.counter;
        const long double perf = time / counter;
        LOG (LOG_CONTINUE, " - Destroying %s %s:", d->name, type_name);
        if (d->shader != 0)
        {
            glDeleteProgram (d->shader);
            LOG (LOG_CONTINUE, " - finished\n");
        }
        else
        {
            LOG (LOG_CONTINUE, " - skipped\n");
        }
        if (type == COMPUTE_SHADER && !(isnan (perf) || isinf (perf)))
        {
            LOG (LOG_CONTINUE,
                " - avg. performance: %Lf / %Lf = %Lf\n",
                time,
                counter,
                perf);
        }
    }
    free (manager->shader);
    manager->shader = NULL;
    manager->num_shaders = 0;
}

GLuint compile_shader (
    const char *restrict src, const char *restrict name, const GLenum type)
{
    GLint success;
    char *c_src = calloc (strlen (src) + 1, sizeof (char));
    strcpy (c_src, src);
    char *version_str = c_src;
    char *rest_of_src = c_src;
    while (*rest_of_src != '\0')
    {
        if (*rest_of_src != '\n')
        {
            rest_of_src++;
        }
        else
        {
            *rest_of_src = '\0';
            rest_of_src++;
            break;
        }
    }
    const char *srcs[] = { version_str,
        "\n#define INCLUDED_FROM_GLSL_CODE 1\n",
        shader_defines_h,
        "\n",
        shader_shader_includes_glsl,
        "\n",
        rest_of_src };

    LOG (LOG_INFO, "Compiling ");
    switch (type)
    {
    case GL_COMPUTE_SHADER:
        LOG (LOG_CONTINUE, "compute");
        break;
    case GL_VERTEX_SHADER:
        LOG (LOG_CONTINUE, "vertex");
        break;
    case GL_TESS_CONTROL_SHADER:
        LOG (LOG_CONTINUE, "tessellation control");
        break;
    case GL_TESS_EVALUATION_SHADER:
        LOG (LOG_CONTINUE, "tessellation evaluation");
        break;
    case GL_GEOMETRY_SHADER:
        LOG (LOG_CONTINUE, "geometry");
        break;
    case GL_FRAGMENT_SHADER:
        LOG (LOG_CONTINUE, "fragment");
        break;
    default:
        LOG (LOG_CONTINUE, "Unknown");
        break;
    }
    LOG (LOG_CONTINUE, " shader(%s)", name);

    // create shader object
    const GLuint shader = glCreateShader (type);
    glShaderSource (shader, 7, srcs, NULL);
    glCompileShader (shader);

    // check for shader compile errors
    glGetShaderiv (shader, GL_COMPILE_STATUS, &success);
    if (!success)
    {
        GLchar infoLog[512];
        glGetShaderInfoLog (shader, 512, NULL, infoLog);
        LOG (LOG_CONTINUE, " - error\n");
        LOG (LOG_ERROR, " - Shader compilation failed: %s\n", infoLog);
        free (c_src);
        return 0;
    }
    LOG (LOG_CONTINUE, " - success\n");
    free (c_src);
    return shader;
}

GLuint link_shader_program (int num_shaders, const GLuint *shaders)
{
    GLint success;
    GLchar infoLog[512];
    LOG (LOG_INFO, "Linking shader program");
    GLuint program = glCreateProgram ();
    for (int i = 0; i < num_shaders; i++)
    {
        glAttachShader (program, shaders[i]);
    }
    glLinkProgram (program);
    glGetProgramiv (program, GL_LINK_STATUS, &success);
    if (!success)
    {
        glGetProgramInfoLog (program, 512, NULL, infoLog);
        LOG (LOG_CONTINUE, " - error\n");
        LOG (LOG_ERROR, " - Program linking failed: %s\n", infoLog);
        program = 0;
    }
    else
    {
        LOG (LOG_CONTINUE, " - success\n");
    }
    for (int i = 0; i < num_shaders; i++)
    {
        glDeleteShader (shaders[i]);
    }
    return program;
}

GLuint vlink_shader_program (const int num_shaders, ...)
{
    va_list ap;
    GLuint *shaders = calloc (num_shaders, sizeof (GLuint));
    va_start (ap, num_shaders);
    for (int i = 0; i < num_shaders; i++)
    {
        shaders[i] = va_arg (ap, GLuint);
    }
    va_end (ap);
    const GLuint program = link_shader_program (num_shaders, shaders);
    free (shaders);
    return program;
}

GLuint create_shader_program (
    const int num_shaders, shader_source shader_srcs[])
{
    GLuint *shaders = calloc (num_shaders, sizeof (GLuint));
    GLuint program = 0;
    assert (shaders != NULL);
    for (int i = 0; i < num_shaders; i++)
    {
        size_t len = 1;
        for (int j = 0; j < shader_srcs[i].num_sources; j++)
        {
            const char *str = shader_srcs[i].src[j];
            len += strlen (str);
        }
        char *buffer = calloc (len, sizeof (char));
        assert (buffer != NULL);
        strcpy (buffer, shader_srcs[i].src[0]);
        for (int j = 1; j < shader_srcs[i].num_sources; j++)
        {
            strcat (buffer, shader_srcs[i].src[j]);
        }
        shaders[i] = compile_shader (
            buffer, shader_srcs[i].name, shader_srcs[i].type);
        free (buffer);
        if (shaders[i] == 0)
        {
            for (int j = 0; j < i; j++)
            {
                glDeleteShader (shaders[j]);
            }
            goto end;
        }
    }
    program = link_shader_program (num_shaders, shaders);
end:
    free (shaders);
    return program;
}