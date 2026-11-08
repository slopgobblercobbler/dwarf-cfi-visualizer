def export_dot(edges):
    return 'digraph G {\n' + '\n'.join('  ' + str(u) + ' -> ' + str(v) + ';' for u, v in edges) + '\n}'
