import sys

DEBUG = False

def money(amount):
	rounded = round(amount, 2)
	short = str(rounded).index('.') > len(str(rounded)) - 3
	if short:
		rounded = str(rounded) + '0'
	return '$' + str(rounded)

plans = ['0', '40', '80', '100', '160', '220', 'Premium']
plan_prices = {'0': 0.0, '40': 518.0, '80': 1039.0, '100': 1284.0, '160': 1983.0, '220': 2729.0, 'Premium': 2980.0}
plan_meals = {'0': 0, '40': 40, '80': 80, '100': 100, '160': 160, '220': 220, 'Premium': 336}
jumbo_prices = {'B': 7.06, 'L': 11.68, 'D': 13.69}

semester_weeks = 16

weekly_meals = {}
if len(sys.argv) > 1:
	weekly_meals = {'B': float(sys.argv[1]), 'L': float(sys.argv[2]), 'D': float(sys.argv[3])}
else:
	print("Takes three command line arguments for weekly meal numbers")
	exit()

hall_meals = semester_weeks * (weekly_meals['B'] + weekly_meals['L'] + weekly_meals['D'])
hall_dinners = semester_weeks * weekly_meals['D']

cheapest_cost = 100000000
cheapest_plan = None
cheapest_jumbo_cost = 0
cheapest_jumbo_dinners = 0
for plan in plans:
	average_meal_price = plan_prices[plan] / plan_meals[plan] if plan is not '0' else 0.0

	jumbo_breakfast_cost = jumbo_prices['B'] * weekly_meals['B'] * semester_weeks
	jumbo_lunch_cost = jumbo_prices['L'] * weekly_meals['L'] * semester_weeks
	jumbo_dinner_cost = 0

	meals_remaining = plan_meals[plan] - hall_dinners
	if meals_remaining < 0:
		jumbo_dinner_cost += -1 * meals_remaining * jumbo_prices['D']
		cheapest_jumbo_dinners = -1 * meals_remaining

	total_jumbo_cost = jumbo_breakfast_cost + jumbo_lunch_cost + jumbo_dinner_cost
	if plan is 'Premium':
		total_jumbo_cost = 0.0
		cheapest_jumbo_dinners = 0

	total_cost = plan_prices[plan] + total_jumbo_cost
	
	if DEBUG:
		print("~ ~ ~ " + plan + " Plan ~ ~ ~")
		print("Plan: " + money(plan_prices[plan]))
		print("Average meal price: " + money(average_meal_price))
		print("JumboCash: " + money(total_jumbo_cost))
		print("Total: " + money(total_cost))
		print("")

	if total_cost < cheapest_cost:
		cheapest_cost = total_cost
		cheapest_plan = plan
		cheapest_jumbo_cost = total_jumbo_cost

standard_plan = None
for i in range(len(plans) - 1):
	if hall_meals >= plan_meals[plans[i]]:
		standard_plan = plans[i + 1]


print("Your expectations: " + str(weekly_meals['B']) + " breakfasts, " + str(weekly_meals['L']) + " lunches, and " + str(weekly_meals['D']) + " dinners per week")
print("Get the " + cheapest_plan + " plan")
print("Add " + money(cheapest_jumbo_cost) + " in JumboCash")
print("Your total bill will be " + money(cheapest_cost))
print("You will save " + money(plan_prices[standard_plan] - cheapest_cost) + " by using JumboCash")
# print("You will need " + str(hall_meals) + " meals for the semester")
# print("You will need " + str(hall_dinners) + " dinners for the semester")
print("Just use JumboCash for breakfasts and lunches")
print(str(cheapest_jumbo_dinners) + " of your dinners will also be on JumboCash")