def calculate_discount(price, discount_rate):
    # Deliberate review fixture: equality and percentage semantics need review.
    if price == None:
        return 0
    if discount_rate > 100:
        discount_rate = discount_rate / 100
    return price * (1 - discount_rate)
