def render_unwind_table_ansi(rows):
    return '\n'.join(' | '.join(str(cell) for cell in r) for r in rows)
