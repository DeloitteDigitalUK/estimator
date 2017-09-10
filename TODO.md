
# Design

## Algorithm
	1. What is the scope?
	2. What is the solution?
	3. What is the team?
	4. What is the forecast?
	5. What else is there?
	6. What is the total cost and duration?
	7. What do the experts say?

## Domain model

* Project* [Item/block]
	* Name, description
	* Owner, readers, writers
	* Solution* [Item/block]
		* Name, details
		* Start date / dependency
		* Scope
			* Work items (min, max)
			* Split rate
			* Risk* [Table]
				* Name, description
				* Likelihood
				* Impact
		* Team
			* Team member* [Table]
				* Role
				* Grade
				* Quantity
				* Cost
				* Price
			* Throughput samples
			* Throughput guess (min, max)
			* Start date, end date

## User journeys
* Sign up
* Log in
* Add/edit project
	* Share project
	* Add/edit solution
		* Parametrise scope/risks
		* Add/edit team
			* Parametrise throughput
			* Parametrise work pattern
	* Run simulation
	* View plan (at different confidence intervals)
	* View resource forecast
	* Export 