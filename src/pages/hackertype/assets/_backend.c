#include "backend.h"
#include "backend_shader.h"
#include "backend_ubo.h"
#include "defines.h"
#include "dither_kernel.h"
#ifdef __EMSCRIPTEN__
#include <GL/gl.h>
#include <GLES3/gl3.h>
#else
#include "glad/gl.h"
#endif
#include "log.h"
#include "shader.h"

#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#if USE_NUKLEAR
#include "nuklear_defines.h"

#include "nuklear.h"

#include "demo/glfw_opengl4/nuklear_glfw_gl4.h"
#endif

#define INTERNAL_TEXTURE_FORMAT GL_RGBA32F

#define MAX_VERTEX_BUFFER (512 * 1024)
#define MAX_ELEMENT_BUFFER (128 * 1024)

GLdouble window_size[2] = { 0, 0 };

static void error_callback (int error, const char *description);

static GLuint create_vbo (const float vertices[], GLsizeiptr size);

static void create_vao (GLuint vbo,
    GLuint vao,
    GLuint index,
    GLint size,
    GLenum type,
    GLint stride,
    const void *offset);

vertex_data_t init_vertex_data (
    const float vertices[], GLsizeiptr size, int num, int stride);

static GLFWwindow *init_glfw (state_struct *state);

bool state_swap_textures (state_struct *state, bool current_map_is_a);

static void cleanup_glfw (state_struct *state);

void framebuffer_size_callback (GLFWwindow *window, int width, int height);

GLuint create_texture_2d ();
GLuint create_framebuffer (GLuint texture);
GLuint create_ssbo (const void *p, GLsizeiptr size, int flags);

void opengl_error_callback (GLenum source,
    GLenum type,
    GLuint id,
    GLenum severity,
    GLsizei length,
    const GLchar *message,
    const void *user_param);

static const char *create_gaussian_blur_kernel (int radius);

/**
 * Creates a bayer matrix for dithering
 * @param power_of_two dimension of the matrix
 * @return the glsl code containing the matrix
 * @remark size will be rounded up to the nearest power of 2
 */
static const char *create_dither_kernel (uint16_t power_of_two);

bool add_blur_shader (state_struct *state)
{
    LOG (LOG_INFO, "Creating gaussian blur kernel:");
    const char *gaussian_blur_kernel = create_gaussian_blur_kernel (32);
    if (gaussian_blur_kernel == NULL)
    {
        LOG (LOG_CONTINUE, " - error");
        return false;
    }
    LOG (LOG_CONTINUE, " - finished\n");
    const GLuint blur_x
        = (GLuint)(((double)MAP_WIDTH + WORKGROUP_SIZE - 1) / WORKGROUP_SIZE);
    const GLuint blur_y
        = (GLuint)(((double)MAP_HEIGHT + WORKGROUP_SIZE - 1) / WORKGROUP_SIZE);
    {
        GLuint shader = create_shader_program (1,
            (shader_source[]){
                { .type = GL_COMPUTE_SHADER,
                 .src = (const char *[]){ "#version 450 core\n#define "
                                             "VERSION_DEFINED\n#define "
                                             "BLUR_KERNEL_DEFINED\n#"
                                             "define HORIZ_PASS\n",
                        gaussian_blur_kernel,
                        shader_blur_comp },
                 .num_sources = 3,
                 .name = "horizontal blur compute shader" }
        });
        if (shader == 0)
        {
            return false;
        }
        shader_manager_add_compute_shader (&state->shader_manager,
            "horizontal blur",
            shader,
            blur_x,
            blur_y,
            1,
            true);
    }
    {
        GLuint shader = create_shader_program (1,
            (shader_source[]){
                { .type = GL_COMPUTE_SHADER,
                 .src = (const char *[]){ "#version 450 core\n#define "
                                             "VERSION_DEFINED\n#define "
                                             "BLUR_KERNEL_DEFINED\n#define "
                                             "VERT_PASS\n",
                        gaussian_blur_kernel,
                        shader_blur_comp },
                 .num_sources = 3,
                 .name = "vertical blur compute shader" }
        });
        if (shader == 0)
        {
            free ((void *)gaussian_blur_kernel);
            return false;
        }
        shader_manager_add_compute_shader (&state->shader_manager,
            "vertical blur",
            shader,
            blur_x,
            blur_y,
            1,
            true);
    }
    free ((void *)gaussian_blur_kernel);
    return true;
}
state_struct *backend_init (void)
{
    state_struct *state = calloc (1, sizeof (state_struct));
    state->window = init_glfw (state);
    state->window_name[0] = 'A';
    state->window_name[1] = 'n';
    state->window_name[2] = 't';
    state->window_name[3] = 's';
    state->window_name[4] = '\0';
    state->performance.counter = 0;
    state->performance.time = 0;
    state->finished_init = false;
    if (state->window == NULL)
    {
        return state;
    }
#ifndef __EMSCRIPTEN__
    LOG (LOG_INFO, "Init GLAD\n");
    gladLoadGL (glfwGetProcAddress);
    glDebugMessageCallback (opengl_error_callback, NULL);
#endif
    glEnable (GL_BLEND);
    glBlendFunc (GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    glEnable (GL_MULTISAMPLE);
    shader_manager_init (&state->shader_manager, state);
    LOG (LOG_INFO, "Load shaders\n");
    GLuint main_shader = create_shader_program (2,
        (shader_source[]){
            { .type = GL_VERTEX_SHADER,
             .src = (const char *[]){ shader_main_vert },
             .num_sources = 1,
             .name = "main vertex shader"   },
            { .type = GL_FRAGMENT_SHADER,
             .src = (const char *[]){ shader_main_frag },
             .num_sources = 1,
             .name = "main fragment shader" }
    });
    if (main_shader == 0)
    {
        return state;
    }
    shader_manager_add_draw_shader (
        &state->shader_manager, "main", main_shader);
    GLuint map_shader = create_shader_program (2,
        (shader_source[]){
            { .type = GL_VERTEX_SHADER,
             .src = (const char *[]){ shader_map_vert },
             .num_sources = 1,
             .name = "Map vertex shader"   },
            { .type = GL_FRAGMENT_SHADER,
             .src = (const char *[]){ shader_map_frag },
             .num_sources = 1,
             .name = "Map fragment shader" }
    });
    if (map_shader == 0)
    {
        return state;
    }
    shader_manager_add_draw_shader (&state->shader_manager, "map", map_shader);
    {
        static float vertices[] = {
            -1.0f,
            -1.0f,
            0.0f, // v1
            4.0f,
            -1.0f,
            0.0f, // v2
            -1.0f,
            4.0f,
            0.0f, // v3
        };
        state->final_frame_vertex_data = init_vertex_data (
            vertices, sizeof (vertices), 3, 3 * sizeof (float));
    }
    {
        static float vertices[] = {
            -0.70711f, // x1
            -0.70711f, // y1
            0.0f,      // z1

            1.0f, // r1
            0.0f, // g1
            0.0f, // b1

            0.70711f,  // x2
            -0.70711f, // y2
            0.0f,      // z2

            0.0f, // r2
            1.0f, // g2
            0.0f, // b2

            0.0f, // x3
            1.0f, // y3
            0.0f, // z3

            0.0f, // r3
            0.0f, // g3
            1.0f, // b3
        };
        state->main_vtx = init_vertex_data (
            vertices, sizeof (vertices), 3, 6 * sizeof (float));
        create_vao (state->main_vtx.VBO,
            state->main_vtx.VAO,
            1,
            3,
            GL_FLOAT,
            6 * sizeof (float),
            (void *)(3 * sizeof (float)));
    }
    glViewport (0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
    state->map_size[0] = (GLdouble)0;
    state->map_size[1] = (GLdouble)0;
    state->map_size[2] = (GLdouble)MAP_WIDTH;
    state->map_size[3] = (GLdouble)MAP_HEIGHT;
    LOG (LOG_INFO, "Main uniforms:\n");
    state->uniforms_buffer_object.num_elements = NUM_UNIFORMS;
    state->uniforms_buffer_object.members = calloc (3, sizeof (ubo_member));
    state->uniforms_buffer_object.members[0].name = "size";
    state->uniforms_buffer_object.members[0].size = 2 * sizeof (GLdouble);
    state->uniforms_buffer_object.members[1].name = "map_size";
    state->uniforms_buffer_object.members[1].size = 4 * sizeof (GLdouble);
    state->uniforms_buffer_object.members[2].name = "time";
    state->uniforms_buffer_object.members[2].size = sizeof (GLint);
    state->uniforms_buffer_object.ubo = create_uniform_buffer (map_shader,
        &state->uniforms_buffer_object,
        state->uniforms_buffer_object.num_elements);
    update_ubo_member (&state->uniforms_buffer_object, "size", window_size);
    state->map_a = create_texture_2d ();
    state->map_a_framebuffer = create_framebuffer (state->map_a);
    state->map_b = create_texture_2d ();
    state->map_b_framebuffer = create_framebuffer (state->map_b);
#if NUM_COMP_SHADERS > 0
    {
#if ENABLE_SUB_COMPUTE_SHADER == 1
        {
            GLuint shader = create_shader_program (1,
                (shader_source[]){
                    { .type = GL_COMPUTE_SHADER,
                     .src = (const char *[]){ shader_sub_comp },
                     .num_sources = 1,
                     .name = "sub compute shader" }
            });
            if (shader == 0)
            {
                return state;
            }
            shader_manager_add_compute_shader (&state->shader_manager,
                "sub",
                shader,
                (GLuint)(MAP_WIDTH + WORKGROUP_SIZE - 1) / WORKGROUP_SIZE,
                (GLuint)(MAP_HEIGHT + WORKGROUP_SIZE - 1) / WORKGROUP_SIZE,
                1,
                true);
        }
#endif // ENABLE_SUB_COMPUTE_SHADER
#if ENABLE_HORIZONTAL_BLUR_COMPUTE_SHADER == 1                                \
    || ENABLE_VERTICAL_BLUR_COMPUTE_SHADER == 1
        if (!add_blur_shader (state))
        {
            return state;
        }
#endif
#if ENABLE_RGB_COMPRESSION_COMPUTE_SHADER == 1
        {
            GLuint shader = create_shader_program (1,
                (shader_source[]){
                    { .type = GL_COMPUTE_SHADER,
                     .src = (const char *[]){ shader_compress_color_comp },
                     .num_sources = 1,
                     .name = "compress rgb compute shader" }
            });
            if (shader == 0)
            {
                return state;
            }
            shader_manager_add_compute_shader (&state->shader_manager,
                "compress rbg",
                shader,
                (GLuint)(MAP_WIDTH + WORKGROUP_SIZE - 1) / WORKGROUP_SIZE,
                (GLuint)(MAP_HEIGHT + WORKGROUP_SIZE - 1) / WORKGROUP_SIZE,
                1,
                true);
        }
#endif // ENABLE_RGB_COMPRESSION_COMPUTE_SHADER
#if ENABLE_DITHERING_COMPUTE_SHADER == 1
        {
            const int dither_size = 4;
            LOG (LOG_INFO, "Creating dither kernel(%d): ", dither_size);
            const char *dither_kernel = create_dither_kernel (dither_size);
            if (dither_kernel == NULL)
            {
                LOG (LOG_CONTINUE, " - error\n");
                return state;
            }
            LOG (LOG_CONTINUE, " - success\n");
            // LOG (LOG_INFO, "kernel:\n%s", dither_kernel);
            GLuint shader = create_shader_program (1,
                (shader_source[]){
                    { .type = GL_COMPUTE_SHADER,
                     .src = (const char *[]){ "#version 450 core\n#define "
                                                 "VERSION_DEFINED\n#define "
                                                 "DITHER_KERNEL_DEFINED\n",
                            dither_kernel,
                            shader_dither_comp },
                     .num_sources = 3,
                     .name = "dither compute shader" }
            });
            free ((void *)dither_kernel);
            if (shader == 0)
            {
                return state;
            }
            shader_manager_add_compute_shader (&state->shader_manager,
                "dither",
                shader,
                (GLuint)(((double)MAP_WIDTH + WORKGROUP_SIZE - 1)
                         / WORKGROUP_SIZE),
                (GLuint)(((double)MAP_HEIGHT + WORKGROUP_SIZE - 1)
                         / WORKGROUP_SIZE),
                1,
                true);
        }
#endif // ENABLE_DITHERING_COMPUTE_SHADER
    }
#endif
    glBindImageTexture (2,
        state->map_a,
        0,
        GL_FALSE,
        0,
        GL_READ_WRITE,
        INTERNAL_TEXTURE_FORMAT);
    glBindImageTexture (3,
        state->map_b,
        0,
        GL_FALSE,
        0,
        GL_READ_WRITE,
        INTERNAL_TEXTURE_FORMAT);
    state->active_framebuffer = state->map_b_framebuffer;
    state->current_map_is_a = true;
#if USE_NUKLEAR
    LOG (LOG_INFO, "Init nuklear\n");
    state->nuklear.ctx = nk_glfw3_init (state->window,
        NK_GLFW3_INSTALL_CALLBACKS,
        MAX_VERTEX_BUFFER,
        MAX_ELEMENT_BUFFER);
    struct nk_font_atlas *atlas;
    nk_glfw3_font_stash_begin (&atlas);
    nk_glfw3_font_stash_end ();
#endif
    state->time = 0;
    state->finished_init = true;
    LOG (LOG_INFO, "finished init\n");
    return state;
}

GLFWwindow *init_glfw (state_struct *state)
{
    LOG (LOG_INFO, "Initialize glfw\n");
    if (!glfwInit ())
    {
        LOG (LOG_ERROR, "Could not initialize glfw\n");
        return NULL;
    }
    glfwSetErrorCallback (error_callback);
    // Create window
    LOG (LOG_INFO, "Initialize window\n");
    // glfwWindowHint(GLFW_TRANSPARENT_FRAMEBUFFER, GLFW_TRUE);
    // glfwWindowHint(GLFW_RESIZABLE, GLFW_FALSE);
    glfwWindowHint (GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint (GLFW_CONTEXT_VERSION_MINOR, 5);
#if !NDEBUG
    glfwWindowHint (GLFW_OPENGL_DEBUG_CONTEXT, GL_TRUE);
#endif

    glfwWindowHint (GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    glfwWindowHint (GLFW_OPENGL_FORWARD_COMPAT, GLFW_TRUE);
#ifndef __EMSCRIPTEN__
    glfwWindowHint (GLFW_TRANSPARENT_FRAMEBUFFER, GLFW_TRUE);
    glfwWindowHint (GLFW_MOUSE_PASSTHROUGH, GLFW_TRUE);
    glfwWindowHint (GLFW_DECORATED, GLFW_FALSE);
    glfwWindowHint (GLFW_FLOATING, GLFW_TRUE);
#endif
    glfwWindowHint (GLFW_CLIENT_API, GLFW_OPENGL_API);

    GLFWmonitor *monitor = glfwGetPrimaryMonitor ();
    const GLFWvidmode *mode = glfwGetVideoMode (monitor);

    glfwWindowHint (GLFW_SAMPLES, 4);
    glfwWindowHint (GLFW_RED_BITS, mode->redBits);
    glfwWindowHint (GLFW_GREEN_BITS, mode->greenBits);
    glfwWindowHint (GLFW_BLUE_BITS, mode->blueBits);
    glfwWindowHint (GLFW_REFRESH_RATE, mode->refreshRate);
    window_size[0] = mode->width + 1;
    window_size[1] = mode->height + 1;
    GLFWwindow *window = /*glfwCreateWindow (
        WINDOW_WIDTH, WINDOW_HEIGHT, "N-Body", 0, NULL);*/
        glfwCreateWindow (
            mode->width + 1, mode->height + 1, "N-Body", 0, NULL);
    glfwMakeContextCurrent (window);
    glfwSetFramebufferSizeCallback (window, framebuffer_size_callback);
    if (!window)
    {
        LOG (LOG_ERROR, "Could not create window or context\n");
        return NULL;
    }
#ifndef __EMSCRIPTEN__
    if (!glfwGetWindowAttrib (window, GLFW_TRANSPARENT_FRAMEBUFFER))
    {
        LOG (LOG_ERROR, "Could not create transparent framebuffer\n");
        return NULL;
    }
#endif

    return window;
}

void draw (state_struct *state)
{
    state->performance.counter++;
    const clock_t begin = clock ();
    static GLdouble view_map_size[4] = { -1, -1, 1, 1 };
    glBindFramebuffer (GL_FRAMEBUFFER, 0);
    glClearColor (0.0f, 0.0f, 0.0f, 0.0f);
    glClear (GL_COLOR_BUFFER_BIT);

    glBindBuffer (GL_UNIFORM_BUFFER, state->uniforms_buffer_object.ubo);
    glBindBufferBase (GL_UNIFORM_BUFFER,
        state->uniforms_buffer_object.index,
        state->uniforms_buffer_object.ubo);
    state->time += 1;
    update_ubo_member (&state->uniforms_buffer_object, "time", &state->time);
    update_ubo_member (
        &state->uniforms_buffer_object, "map_size", view_map_size);
    update_ubo_member (&state->uniforms_buffer_object, "size", window_size);
    upload_ubo (&state->uniforms_buffer_object);
    glBindVertexArray (state->main_vtx.VAO);
    glViewport (0, 0, MAP_WIDTH, MAP_HEIGHT);
    shader_manager_load_program (&state->shader_manager, "map");
    glBindFramebuffer (GL_FRAMEBUFFER, state->active_framebuffer);
    glDrawArrays (GL_TRIANGLES, 0, 6);
    state->current_map_is_a
        = state_swap_textures (state, state->current_map_is_a);

    shader_manager_load_program (&state->shader_manager, "sub");
    shader_manager_load_program (&state->shader_manager, "vertical blur");
    shader_manager_load_program (&state->shader_manager, "horizontal blur");
    shader_manager_load_program (&state->shader_manager, "compress rgb");
    shader_manager_load_program (&state->shader_manager, "dither");

    glBindFramebuffer (GL_FRAMEBUFFER, 0);
    glBindVertexArray (state->final_frame_vertex_data.VAO);
    glViewport (0, 0, window_size[0], window_size[1]);
    shader_manager_load_program (&state->shader_manager, "main");
    glDrawArrays (GL_TRIANGLES, 0, 3);
    state->current_map_is_a
        = state_swap_textures (state, state->current_map_is_a);
#if USE_NUKLEAR
    nk_glfw3_new_frame ();
    if (nk_begin (state->nuklear.ctx,
            "Demo",
            nk_rect (50, 50, 230, 250),
            NK_WINDOW_BORDER | NK_WINDOW_MOVABLE | NK_WINDOW_SCALABLE
                | NK_WINDOW_MINIMIZABLE | NK_WINDOW_TITLE))
    {
    }
    nk_end (state->nuklear.ctx);
    nk_glfw3_render (NK_ANTI_ALIASING_OFF);
#endif
    // Swap buffers and poll for events
    glfwSwapBuffers (state->window);
    const clock_t end = clock ();
    state->performance.time = end - begin;
}

void update (state_struct *state)
{
    // do stuff
}

GLFWwindow *backend_get_window (const state_struct *state)
{
    return state->window;
}

void backend_deinit (state_struct **state)
{
    cleanup_glfw (*state);
    free (*state);
    *state = NULL;
}

bool state_swap_textures (state_struct *state, const bool current_map_is_a)
{
    if (current_map_is_a)
    {
        glBindImageTexture (2,
            state->map_b,
            0,
            GL_FALSE,
            0,
            GL_READ_WRITE,
            INTERNAL_TEXTURE_FORMAT);
        glBindImageTexture (3,
            state->map_a,
            0,
            GL_FALSE,
            0,
            GL_READ_WRITE,
            INTERNAL_TEXTURE_FORMAT);
        state->active_framebuffer = state->map_a_framebuffer;
    }
    else
    {
        glBindImageTexture (2,
            state->map_a,
            0,
            GL_FALSE,
            0,
            GL_READ_WRITE,
            INTERNAL_TEXTURE_FORMAT);
        glBindImageTexture (3,
            state->map_b,
            0,
            GL_FALSE,
            0,
            GL_READ_WRITE,
            INTERNAL_TEXTURE_FORMAT);
        state->active_framebuffer = state->map_b_framebuffer;
    }
    return !current_map_is_a;
}

GLuint create_ssbo (const void *p, const GLsizeiptr size, const int flags)
{
    GLuint SSBO;
    glCreateBuffers (1, &SSBO);
    glNamedBufferStorage (SSBO, size, p, flags);
    glBindBuffer (GL_SHADER_STORAGE_BUFFER, 0);
    return SSBO;
}

GLuint create_texture_2d ()
{
    GLuint texture;
    glGenTextures (1, &texture);
    glBindTexture (GL_TEXTURE_2D, texture);
    GLdouble *tmp_map = calloc (MAP_WIDTH * MAP_HEIGHT, 4 * sizeof (GLfloat));
    glTexImage2D (GL_TEXTURE_2D,
        0,
        INTERNAL_TEXTURE_FORMAT,
        MAP_WIDTH,
        MAP_HEIGHT,
        0,
        GL_RGBA,
        GL_FLOAT,
        tmp_map);
    glTexParameteri (GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    glTexParameteri (GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    free (tmp_map);
    return texture;
}

GLuint create_framebuffer (const GLuint texture)
{
    GLuint FramebufferName = 0;
    glGenFramebuffers (1, &FramebufferName);
    glGenFramebuffers (1, &FramebufferName);
    glBindFramebuffer (GL_FRAMEBUFFER, FramebufferName);
    glBindTexture (GL_TEXTURE_2D, texture);

    glTexParameteri (GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    glTexParameteri (GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);

    glFramebufferTexture (GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, texture, 0);

    // Set the list of draw buffers.
    GLenum DrawBuffers[1] = { GL_COLOR_ATTACHMENT0 };
    glDrawBuffers (1, DrawBuffers);
    return FramebufferName;
}

static GLuint create_vbo (const float vertices[], const GLsizeiptr size)
{
    GLuint VBO;
    glGenBuffers (1, &VBO);
    glBindBuffer (GL_ARRAY_BUFFER, VBO);
    glBufferData (GL_ARRAY_BUFFER, size, vertices, GL_STATIC_DRAW);
    return VBO;
}

static void create_vao (const GLuint vbo,
    const GLuint vao,
    const GLuint index,
    const GLint size,
    const GLenum type,
    const GLint stride,
    const void *offset)
{
    glBindBuffer (GL_ARRAY_BUFFER, vbo);
    glBindVertexArray (vao);
    glEnableVertexAttribArray (index);
    glVertexAttribPointer (index, size, type, GL_FALSE, stride, offset);
    glEnableVertexAttribArray (index);
}

vertex_data_t init_vertex_data (
    const float vertices[], const GLsizeiptr size, const int num, int stride)
{
    const GLuint VBO = create_vbo (vertices, size);
    GLuint VAO;
    glGenVertexArrays (1, &VAO);
    create_vao (VBO, VAO, 0, num, GL_FLOAT, stride, 0);
    return (vertex_data_t){ .VBO = VBO, .VAO = VAO };
}

static void delete_vbo_and_vao (const vertex_data_t *s)
{
    if (s->VAO != 0)
    {
        glDeleteVertexArrays (1, &s->VAO);
    }
    if (s->VBO != 0)
    {
        glDeleteBuffers (1, &s->VBO);
    }
}
void cleanup_glfw (state_struct *s)
{
    const long double time = s->performance.time;
    const long double counter = s->performance.counter;
    const long double perf = time / counter;
    LOG (LOG_INFO,
        " - avg. draw performance: %Lf / %Lf = %Lf\n",
        time,
        counter,
        perf);
    LOG (LOG_INFO, "Destroying vertex buffer\n");
    delete_vbo_and_vao (&s->final_frame_vertex_data);
    delete_vbo_and_vao (&s->main_vtx);
    if (s->uniforms_buffer_object.ubo != 0)
    {
        LOG (LOG_INFO, "Destroying uniforms buffer\n");
        glDeleteBuffers (1, &s->uniforms_buffer_object.ubo);
    }
    LOG (LOG_INFO, "Destroying framebuffers\n");
    if (s->map_a_framebuffer != 0)
    {
        glDeleteFramebuffers (1, &s->map_a_framebuffer);
    }
    if (s->map_b_framebuffer != 0)
    {
        glDeleteFramebuffers (1, &s->map_b_framebuffer);
    }
    LOG (LOG_INFO, "Destroying textures\n");
    if (s->map_a != 0)
    {
        glDeleteTextures (1, &s->map_a);
    }
    if (s->map_b != 0)
    {
        glDeleteTextures (1, &s->map_b);
    }
    free (s->uniforms_buffer_object.buffer);
    LOG (LOG_INFO, "Deleting shaders\n");
    shader_manager_free (&s->shader_manager);
    if (s->window != NULL)
    {
        LOG (LOG_INFO, "Destroying window\n");
        glfwDestroyWindow (s->window);
    }
    LOG (LOG_INFO, "Terminating glfw\n");
    glfwTerminate ();
}

static void error_callback (const int error, const char *description)
{
    LOG (LOG_ERROR, "Error(%d): %s\n", error, description);
}

void framebuffer_size_callback (
    GLFWwindow *window, const int width, const int height)
{
    window_size[0] = (GLdouble)width;
    window_size[1] = (GLdouble)height;
    glViewport (0, 0, width, height);
}

void opengl_error_callback (GLenum source,
    GLenum type,
    GLuint id,
    GLenum severity,
    GLsizei length,
    const GLchar *message,
    const void *user_param)
{
    const char *source_str = NULL;
    const char *type_str = NULL;
    const char *severity_str = NULL;
    switch (source)
    {
    case GL_DEBUG_SOURCE_API:
        source_str = "API";
        break;
    case GL_DEBUG_SOURCE_APPLICATION:
        source_str = "APPLICATION";
        break;
    case GL_DEBUG_SOURCE_OTHER:
        source_str = "OTHER";
        break;
    case GL_DEBUG_SOURCE_SHADER_COMPILER:
        source_str = "SHADER_COMPILER";
        break;
    case GL_DEBUG_SOURCE_THIRD_PARTY:
        source_str = "THIRD_PARTY";
        break;
    case GL_DEBUG_SOURCE_WINDOW_SYSTEM:
        source_str = "WINDOW_SYSTEM";
        break;
    default:
        source_str = "UNKNOWN_SOURCE";
        break;
    }
    switch (type)
    {
    case GL_DEBUG_TYPE_DEPRECATED_BEHAVIOR:
        type_str = "DEPRECATED_BEHAVIOR";
        break;
    case GL_DEBUG_TYPE_ERROR:
        type_str = "ERROR";
        break;
    case GL_DEBUG_TYPE_MARKER:
        type_str = "MARKER";
        break;
    case GL_DEBUG_TYPE_OTHER:
        type_str = "OTHER";
        break;
    case GL_DEBUG_TYPE_PERFORMANCE:
        type_str = "PERFORMANCE";
        break;
    case GL_DEBUG_TYPE_POP_GROUP:
        type_str = "POP_GROUP";
        break;
    case GL_DEBUG_TYPE_PORTABILITY:
        type_str = "PORTABILITY";
        break;
    case GL_DEBUG_TYPE_PUSH_GROUP:
        type_str = "PUSH_GROUP";
        break;
    case GL_DEBUG_TYPE_UNDEFINED_BEHAVIOR:
        type_str = "UNDEFINED_BEHAVIOR";
        break;
    default:
        type_str = "UNKNOWN_TYPE";
        break;
    }
    switch (severity)
    {
    case GL_DEBUG_SEVERITY_HIGH:
        severity_str = "HIGH";
        break;
    case GL_DEBUG_SEVERITY_LOW:
        severity_str = "LOW";
        break;
    case GL_DEBUG_SEVERITY_MEDIUM:
        severity_str = "MEDIUM";
        break;
    case GL_DEBUG_SEVERITY_NOTIFICATION:
        severity_str = "NOTIFICATION";
        return;
        break;
    default:
        severity_str = "UNKNOWN_SEVERITY";
        break;
    }
    LOG (LOG_ERROR,
        "(%d) %s(%s) in %s:\n",
        id,
        type_str,
        source_str,
        severity_str);
    LOG (LOG_CONTINUE, " - %s\n", message);
}
static double gaussian (int x, int mu, double sigma)
{
    const double a = (x - mu) / sigma;
    return exp (-0.5 * a * a);
}
const char *create_gaussian_blur_kernel (const int radius)
{
    const double sigma = radius / 2.0;
    const int size = 2 * radius + 1;
    int length = 60 /*size def*/;
    length += 22 /*start of kernel def*/;
    length += 5 /*bracket open and close with sem*/;
    length += size * (2 /*0.*/ + 32 /*0000*/ + 2 /*, */) + 1 /*\n*/;
    length += 1 /*\0*/;
    length += 10 /*just to be safe*/;
    char *res = calloc (length, sizeof (char));
    if (res == NULL)
    {
        return NULL;
    }
    sprintf (res,
        "#define kernel_size %d\nconst float blur_kernel[] "
        "=\n{\n",
        size);
    double *kernel = calloc (size, sizeof (double));
    if (kernel == NULL)
    {
        free (res);
        return NULL;
    }
    double sum = 0.0;
    for (int i = 0; i < size; i++)
    {
        const double x = gaussian (i, radius, sigma);
        kernel[i] = x;
        sum += x;
    }
    for (int i = 0; i < size; i++)
    {
        char tmp[16] = { 0 };
        double value = kernel[i] / sum;
        if (isnan (value))
        {
            value = 1.0;
        }
        sprintf (tmp, "%f, ", value);
        strcat (res, tmp);
    }
    strcat (res, "\n");
    free (kernel);
    strcat (res, "};\n");
    return res;
}

const char *create_dither_kernel (const uint16_t power_of_two)
{
    const uint16_t size = 1 << power_of_two;
    int length = 120 /*size def*/;
    length += 22 /*start of kernel def*/;
    length += 5 /*bracket open and close with sem*/;
    length += size * 2 * (size * (10 /*0000000000*/ + 2 /*, */) + 10 /*\n*/);
    length += 1 /*\0*/;
    length += 10 /*just to be safe*/;
    const uint32_t *matrix = get_dither_matrix (power_of_two);
    if (matrix == NULL)
    {
        return NULL;
    }
    char *res = calloc (length, sizeof (char));
    if (res == NULL)
    {
        return NULL;
    }
    sprintf (res,
        "#define kernel_size %d\n#define kernel_size_squared_inv %f\nint "
        "dither_kernel[] "
        "=\n{\n",
        size,
        1.0 / (double)(size * size));
    for (uint16_t y = 0; y < size; y++)
    {
        for (uint16_t x = 0; x < size; x++)
        {
            const uint32_t value = matrix[y * size + x];
            char tmp[16] = { 0 };
            sprintf (tmp, "%d, ", value);
            strcat (res, tmp);
        }
        strcat (res, "\n");
    }
    strcat (res, "};\n");
    return res;
}
