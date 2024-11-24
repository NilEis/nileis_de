#include "backend.h"
#include "thread_creator.h"

#include <stdlib.h>

THREAD_FUNCTION (update_wrapper)
{
    state_struct *state = arg;
    while (1)
    {
        update (state);
    }
}

int main ()
{
    state_struct *state = backend_init ();
    int ret = 0;
    if (state->finished_init)
    {
        GLFWwindow *window = state->window;
        // const thread t = thread_create (update_wrapper, state);
        while (!glfwWindowShouldClose (window))
        {
            draw (state);
            glfwPollEvents ();
            if (glfwGetKey (window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            {
                // thread_stop (t);
                break;
            }
        }
    }
    else
    {
        ret = 1;
    }

    backend_deinit (&state);
    return ret;
}