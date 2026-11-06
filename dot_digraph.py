def render_cfi_dot(nodes, edges):
    return 'digraph CFI {\n' + '\n'.join(f'  "{u}" -> "{v}";' for u, v in edges) + '\n}'
