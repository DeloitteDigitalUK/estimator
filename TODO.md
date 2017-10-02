# Bugs

* When creating a new project and adding a solution for the first time, the
  list of solutions is not draggable.

# Tasks

* Add burn-down simulation chart?
    - use simulation metadata: `totalBacklog` and items remaining each day after `periods`

* Hints about estimation quality when building up solution parameters
    - samples: 7-25, not too old
    - backlog size, split rate: not too close together (max at least 10% above min?)
    - error range:
        - randomly split samples into two groups
        - find absolute diff between avg of each group
        - error % = diff / (overall max - overall min)
        - keep error % < 25%?

* Export resource forecast at a particular confidence interval

    - use xlsx-template to write:

        `${dates}` -- all dates in the plan
        
        `${table:resources.role}`           -- from team members table
        `${table:resources.description}`    -- from team members table
        `${table:resources.dates}`          -- list of all dates in the plan, either 0 or FTEs

* Allow each solution to set out which confidence interval to use for the plan?