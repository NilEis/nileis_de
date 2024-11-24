#include "backend_ubo.h"
#include "log.h"

#include <stdlib.h>
#include <string.h>

static int compare_ubo_member (const void *a, const void *b)
{
    const ubo_member *x = (ubo_member *)a;
    const ubo_member *y = (ubo_member *)b;
    return strcmp (x->name, y->name);
}

static const char *get_ubo_member_type_name (GLenum type)
{
    switch (type)
    {
    case GL_FLOAT:
        return "float";
    case GL_FLOAT_VEC2:
        return "vec2";
    case GL_FLOAT_VEC3:
        return "vec3";
    case GL_FLOAT_VEC4:
        return "vec4";
    case GL_DOUBLE:
        return "double";
    case GL_DOUBLE_VEC2:
        return "dvec2";
    case GL_DOUBLE_VEC3:
        return "dvec3";
    case GL_DOUBLE_VEC4:
        return "dvec4";
    case GL_INT:
        return "int";
    case GL_INT_VEC2:
        return "ivec2";
    case GL_INT_VEC3:
        return "ivec3";
    case GL_INT_VEC4:
        return "ivec4";
    case GL_UNSIGNED_INT:
        return "unsigned int";
    case GL_UNSIGNED_INT_VEC2:
        return "uvec2";
    case GL_UNSIGNED_INT_VEC3:
        return "uvec3";
    case GL_UNSIGNED_INT_VEC4:
        return "uvec4";
    case GL_BOOL:
        return "bool";
    case GL_BOOL_VEC2:
        return "bvec2";
    case GL_BOOL_VEC3:
        return "bvec3";
    case GL_BOOL_VEC4:
        return "bvec4";
    case GL_FLOAT_MAT2:
        return "mat2";
    case GL_FLOAT_MAT3:
        return "mat3";
    case GL_FLOAT_MAT4:
        return "mat4";
    case GL_FLOAT_MAT2x3:
        return "mat2x3";
    case GL_FLOAT_MAT2x4:
        return "mat2x4";
    case GL_FLOAT_MAT3x2:
        return "mat3x2";
    case GL_FLOAT_MAT3x4:
        return "mat3x4";
    case GL_FLOAT_MAT4x2:
        return "mat4x2";
    case GL_FLOAT_MAT4x3:
        return "mat4x3";
    case GL_DOUBLE_MAT2:
        return "dmat2";
    case GL_DOUBLE_MAT3:
        return "dmat3";
    case GL_DOUBLE_MAT4:
        return "dmat4";
    case GL_DOUBLE_MAT2x3:
        return "dmat2x3";
    case GL_DOUBLE_MAT2x4:
        return "dmat2x4";
    case GL_DOUBLE_MAT3x2:
        return "dmat3x2";
    case GL_DOUBLE_MAT3x4:
        return "dmat3x4";
    case GL_DOUBLE_MAT4x2:
        return "dmat4x2";
    case GL_DOUBLE_MAT4x3:
        return "dmat4x3";
    case GL_SAMPLER_1D:
        return "sampler1D";
    case GL_SAMPLER_2D:
        return "sampler2D";
    case GL_SAMPLER_3D:
        return "sampler3D";
    case GL_SAMPLER_CUBE:
        return "samplerCube";
    case GL_SAMPLER_1D_SHADOW:
        return "sampler1DShadow";
    case GL_SAMPLER_2D_SHADOW:
        return "sampler2DShadow";
    case GL_SAMPLER_1D_ARRAY:
        return "sampler1DArray";
    case GL_SAMPLER_2D_ARRAY:
        return "sampler2DArray";
    case GL_SAMPLER_1D_ARRAY_SHADOW:
        return "sampler1DArrayShadow";
    case GL_SAMPLER_2D_ARRAY_SHADOW:
        return "sampler2DArrayShadow";
    case GL_SAMPLER_2D_MULTISAMPLE:
        return "sampler2DMS";
    case GL_SAMPLER_2D_MULTISAMPLE_ARRAY:
        return "sampler2DMSArray";
    case GL_SAMPLER_CUBE_SHADOW:
        return "samplerCubeShadow";
    case GL_SAMPLER_BUFFER:
        return "samplerBuffer";
    case GL_SAMPLER_2D_RECT:
        return "sampler2DRect";
    case GL_SAMPLER_2D_RECT_SHADOW:
        return "sampler2DRectShadow";
    case GL_INT_SAMPLER_1D:
        return "isampler1D";
    case GL_INT_SAMPLER_2D:
        return "isampler2D";
    case GL_INT_SAMPLER_3D:
        return "isampler3D";
    case GL_INT_SAMPLER_CUBE:
        return "isamplerCube";
    case GL_INT_SAMPLER_1D_ARRAY:
        return "isampler1DArray";
    case GL_INT_SAMPLER_2D_ARRAY:
        return "isampler2DArray";
    case GL_INT_SAMPLER_2D_MULTISAMPLE:
        return "isampler2DMS";
    case GL_INT_SAMPLER_2D_MULTISAMPLE_ARRAY:
        return "isampler2DMSArray";
    case GL_INT_SAMPLER_BUFFER:
        return "isamplerBuffer";
    case GL_INT_SAMPLER_2D_RECT:
        return "isampler2DRect";
    case GL_UNSIGNED_INT_SAMPLER_1D:
        return "usampler1D";
    case GL_UNSIGNED_INT_SAMPLER_2D:
        return "usampler2D";
    case GL_UNSIGNED_INT_SAMPLER_3D:
        return "usampler3D";
    case GL_UNSIGNED_INT_SAMPLER_CUBE:
        return "usamplerCube";
    case GL_UNSIGNED_INT_SAMPLER_1D_ARRAY:
        return "usampler2DArray";
    case GL_UNSIGNED_INT_SAMPLER_2D_ARRAY:
        return "usampler2DArray";
    case GL_UNSIGNED_INT_SAMPLER_2D_MULTISAMPLE:
        return "usampler2DMS";
    case GL_UNSIGNED_INT_SAMPLER_2D_MULTISAMPLE_ARRAY:
        return "usampler2DMSArray";
    case GL_UNSIGNED_INT_SAMPLER_BUFFER:
        return "usamplerBuffer";
    case GL_UNSIGNED_INT_SAMPLER_2D_RECT:
        return "usampler2DRect";
    default:
        return "invalid type";
    }
}

static ubo_member *get_ubo_member_by_name (
    const ubo_struct *uniforms, const char *name)
{
    const ubo_member m = { .name = name };
    return bsearch (&m,
        uniforms->members,
        uniforms->num_elements,
        sizeof (ubo_member),
        compare_ubo_member);
}

GLuint create_uniform_buffer (
    const GLuint program, ubo_struct *uniforms, int number_of_uniforms)
{
    qsort (uniforms->members,
        uniforms->num_elements,
        sizeof (ubo_member),
        compare_ubo_member);
    glUseProgram (program);

    GLint num_blocks;
    glGetProgramiv (program, GL_ACTIVE_UNIFORM_BLOCKS, &num_blocks);
    LOG (LOG_INFO, "Num uniform blocks: %u\n", num_blocks);

    uniforms->index = glGetUniformBlockIndex (program, "uniforms_buffer");
    LOG (LOG_INFO, "Uniform index: %d\n", uniforms->index);

    glGetActiveUniformBlockiv (program,
        uniforms->index,
        GL_UNIFORM_BLOCK_DATA_SIZE,
        &uniforms->block_size);
    LOG (LOG_INFO, "Uniform size: %d\n", uniforms->block_size);
    uniforms->buffer = calloc (1, uniforms->block_size);

    {
        const GLchar **names = calloc (number_of_uniforms, sizeof (char *));
        for (int i = 0; i < number_of_uniforms; i++)
        {
            names[i] = uniforms->members[i].name;
        }
        GLuint *indices = calloc (number_of_uniforms, sizeof (GLuint));
        GLint *offsets = calloc (number_of_uniforms, sizeof (GLint));
        GLint *types = calloc (number_of_uniforms, sizeof (GLenum));

        glGetUniformIndices (program, number_of_uniforms, names, indices);
        glGetActiveUniformsiv (
            program, number_of_uniforms, indices, GL_UNIFORM_OFFSET, offsets);
        glGetActiveUniformsiv (
            program, number_of_uniforms, indices, GL_UNIFORM_TYPE, types);
        for (int i = 0; i < number_of_uniforms; i++)
        {
            ubo_member *member = get_ubo_member_by_name (uniforms, names[i]);
            member->index = indices[i];
            member->offset = offsets[i];
            member->type = types[i];
        }
        free (names);
        free (indices);
        free (offsets);
        free (types);
    }
    for (int i = 0; i < number_of_uniforms; i++)
    {
        LOG (LOG_INFO,
            " - index %s(%s): %d - offset: %d\n",
            uniforms->members[i].name,
            get_ubo_member_type_name (uniforms->members[i].type),
            uniforms->members[i].index,
            uniforms->members[i].offset);
    }
    GLuint ubo_handle;
    glGenBuffers (1, &ubo_handle);
    glBindBuffer (GL_UNIFORM_BUFFER, ubo_handle);
    glBufferData (GL_UNIFORM_BUFFER,
        uniforms->block_size,
        uniforms->buffer,
        GL_DYNAMIC_DRAW);
    glBindBufferBase (GL_UNIFORM_BUFFER, uniforms->index, uniforms->ubo);
    return ubo_handle;
}
void update_ubo_member (
    const ubo_struct *uniforms, const char *name, const void *v)
{
    const ubo_member *m = get_ubo_member_by_name (uniforms, name);
    memcpy (uniforms->buffer + m->offset, v, m->size);
}
void upload_ubo (const ubo_struct *uniforms)
{
    glBufferSubData (
        GL_UNIFORM_BUFFER, 0, uniforms->block_size, uniforms->buffer);
}