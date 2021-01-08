// Constants

var WEEKS_PER_SEMESTER = 16;

var PLAN_NAMES = ["None", "40", "80", "100", "160", "220", "Unlimited"];

var PLAN_PRICES = { "None": 0.0, 
					"40": 536.0, 
					"80": 1076.0, 
					"100": 1328.0, 
					"160": 2053.0, 
					"220": 2824.0, 
					"Unlimited": 3087.0};

var PLAN_MEAL_COUNTS = {"None": 0, 
						"40": 40, 
						"80": 80, 
						"100": 100, 
						"160": 160, 
						"220": 220, 
						"Unlimited": 400};

var MEAL_NAMES = ["breakfast", "lunch", "dinner"];

var MEAL_PRICES = { "breakfast": 7.06, 
					"lunch": 11.68, 
					"dinner": 13.69};

// Startup

$(function() {
	var sliders = document.querySelectorAll("input[type=range]");

	// Slider events
	$(sliders).rangeslider({
		polyfill: false,
		onInit: function() {},
		onSlide: function(position, value) {
			updateLabel($(this), value);
		},
		onSlideEnd: function(position, value) {
			update(sliders);
		}
	});

	$('input[type="range"]').rangeslider('update', true);
});

// Objects

/**
 * Meal plan object
 */
var Plan = function(name, price, mealCount) {
	this.name = name;
	this.price = price;
	this.mealCount = mealCount;
}

/**
 * Results object
 */
var Results = function(plan, jumboCost, jumboMealCounts) {
	this.plan = plan;
	this.jumboCost = jumboCost;
	this.jumboMealCounts = jumboMealCounts;
}

/**
 * MealCounts object
 */
var MealCounts = function(breakfasts, lunches, dinners) {
	this.breakfasts = breakfasts;
	this.lunches = lunches;
	this.dinners = dinners;
}

// Functions

/**
 * Updates a slider label to the given value
 */
function updateLabel(slider, value) {
	var meal = slider.attr("meal");
	$("." + meal + "-setting").html(value);
}

/**
 * Returns an array of values for the sliders
 */
function getMealCounts(sliders) {
	console.log("Sliders: ", sliders)
	var mealCounts = new MealCounts();
	sliders.forEach(function(slider) {
		var meal = $(slider).data("meal");
		var value = slider.value;

		switch (meal) {
			case "breakfast":
				mealCounts["breakfasts"] = parseInt(value, 10);
				break;
			case "lunch":
				mealCounts["lunches"] = parseInt(value, 10);
				break;
			case "dinner":
				mealCounts["dinners"] = parseInt(value, 10);
				break;
		}
	});
	return mealCounts;
}

/**
 * Converts float into US currency format
 */
function toMoneyFormat(amount) {
	return '$' + amount.toFixed(2);
}

/**
 * Returns the best plan results taking into account JumboCash
 */
function getResults(mealPlans, mealCounts) {
	var numTotalBreakfasts = WEEKS_PER_SEMESTER * mealCounts["breakfasts"];
	var numTotalLunches = WEEKS_PER_SEMESTER * mealCounts["lunches"];
	var numTotalDinners = WEEKS_PER_SEMESTER * mealCounts["dinners"];

	var jumboBreakfastCost = MEAL_PRICES["breakfast"] * numTotalBreakfasts;
	var jumboLunchCost = MEAL_PRICES["lunch"] * numTotalLunches;

	var bestPlan;
	var bestPlanCost = Number.MAX_SAFE_INTEGER;
	var bestPlanJumboCost;
	var bestJumboMealCounts;
	mealPlans.forEach(function(plan) {
		var jumboCost = jumboBreakfastCost + jumboLunchCost;
		var jumboMealCounts = new MealCounts(numTotalBreakfasts, numTotalLunches, 0);

		// Change cost and meal counts based on not enough or too many meals
		var surplusMeals = plan.mealCount - numTotalDinners;
		if (surplusMeals < 0) {
			var jumboDinners = Math.abs(surplusMeals);
			jumboCost += jumboDinners * MEAL_PRICES["dinner"];
			jumboMealCounts["dinners"] = jumboDinners;
		}
		else if (surplusMeals > 0) {
			if (surplusMeals < numTotalLunches) {
				jumboCost -= surplusMeals * MEAL_PRICES["lunch"];
				jumboMealCounts["lunches"] = surplusMeals;
			}
			else {
				jumboCost -= numTotalLunches * MEAL_PRICES["lunch"];
				jumboMealCounts["lunches"] = numTotalLunches;

				var surplusBreakfasts = surplusMeals - numTotalLunches;
				if (surplusBreakfasts < numTotalBreakfasts) {
					jumboCost -= surplusBreakfasts * MEAL_PRICES["breakfast"];
					jumboMealCounts["breakfasts"] = surplusBreakfasts;
				}
				else {
					jumboCost -= numTotalBreakfasts * MEAL_PRICES["breakfast"];
					jumboMealCounts["breakfasts"] = numTotalBreakfasts;
				}
			}
		}

		// All meals are included in unlimited
		if (plan.name == "Unlimited") {
			jumboCost = 0.0;
			jumboMealCounts = new MealCounts(0, 0, 0);
		}

		var cost = plan.price + jumboCost;
		if (cost < bestPlanCost) {
			bestPlan = plan;
			bestPlanCost = cost;
			bestPlanJumboCost = jumboCost;
			bestJumboMealCounts = jumboMealCounts;
		}
	});

	return new Results(bestPlan, bestPlanJumboCost, bestJumboMealCounts);
}

/**
 * Returns the best plan without taking into account JumboCash
 */
function getStandardPlan(mealPlans, mealCounts) {
	var numTotalMeals = WEEKS_PER_SEMESTER * (mealCounts["breakfasts"] + mealCounts["lunches"] + mealCounts["dinners"]);

	return mealPlans.reduce(function(prev, plan) {
		var surplusMeals = plan.mealCount - numTotalMeals;
		if (surplusMeals < 0)
			return prev;
		else if (surplusMeals > 0) {
			var prevSurplusMeals = prev.mealCount - numTotalMeals;
			if (surplusMeals < prevSurplusMeals || prevSurplusMeals < 0)
				return plan;
			else
				return prev;
		}
		else
			return plan;
	});
}

/**
 * Updates the output text
 */
function updateOutputText(bestPlan, jumboCost, jumboMeals, mealCounts, totalBill, amountSaved) {
	// Format the outputs
	var outputText = "";

	outputText += "Best plan: " + bestPlan + "<br />";
	outputText += "Total bill: " + toMoneyFormat(totalBill) + "<br />";
	outputText += "You save: " + toMoneyFormat(amountSaved) + "<br /><br />";

	var jumboCashWeeklyBreakfasts = mealCounts["breakfasts"] - (jumboMeals["breakfasts"] / WEEKS_PER_SEMESTER);
	outputText += "Breakfasts on plan: " + jumboCashWeeklyBreakfasts + "<br />";
	var jumboCashWeeklyLunches = mealCounts["lunches"] - (jumboMeals["lunches"] / WEEKS_PER_SEMESTER);
	outputText += "Lunches on plan: " + jumboCashWeeklyLunches + "<br />";
	var jumboCashWeeklyDinners = mealCounts["dinners"] - (jumboMeals["dinners"] / WEEKS_PER_SEMESTER);
	outputText += "Dinners on plan: " + jumboCashWeeklyDinners + "<br /><br />";

	outputText += "JumboCash needed: " + toMoneyFormat(jumboCost);

	// Update the HTML
	$(".output-text").html(outputText);
}

/**
 * Returns an array of all the meal plans available
 */
function getMealPlans() {
	return PLAN_NAMES.map(function(planName) {
		return new Plan(planName, PLAN_PRICES[planName], PLAN_MEAL_COUNTS[planName]);
	});
}

/**
 * Checks whether lunch and breakfast are still cheaper on JumboCash
 */
function checkConcept(sliders) {

}

/**
 * Runs the calculations and updates the outputs
 */
function update(sliders) {
	var mealPlans = getMealPlans();
	var mealCounts = getMealCounts(sliders);
	
	var standardPlan = getStandardPlan(mealPlans, mealCounts);

	var results = getResults(mealPlans, mealCounts);
	var bestPlan = results.plan;
	var jumboCost = results.jumboCost;
	var jumboMeals = results.jumboMealCounts;

	var totalBill = results.plan.price + results.jumboCost;
	var amountSaved = standardPlan.price - totalBill;
	
	console.log("Standard: ", standardPlan)
	console.log("Best: ", bestPlan)

	updateOutputText(bestPlan.name, jumboCost, jumboMeals, mealCounts, totalBill, amountSaved);
}