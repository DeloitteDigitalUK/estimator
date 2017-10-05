# Bugs

* When creating a new project and adding a solution for the first time, the
  list of solutions is not draggable.

# Tasks

* Add burn-up simulation chart?
    - use simulation metadata: `totalBacklog` and items remaining each day after `periods`
    - simulate up to 50 runs?

* Hints about estimation quality when building up solution parameters
    - samples: 7-25, not too old
    - backlog size, split rate: not too close together (max at least 10% above min?)
    - error range:
        - randomly split samples into two groups
        - find absolute diff between avg of each group
        - error % = diff / (overall max - overall min)
        - keep error % < 25%?

# Ideas

* Allow each solution to set out which confidence interval to use for the plan?
* Support for "blink estimation" and other forms of triangulation?
