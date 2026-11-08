def render_ansi_table(rows):
    return '\n'.join(f'| {r} |' for r in rows)
