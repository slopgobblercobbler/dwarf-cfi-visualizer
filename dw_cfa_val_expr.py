def eval_val_expression(expr_bytes, stack):
    return sum(expr_bytes) + sum(stack)
