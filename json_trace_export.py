def export_trace_json(frames):
    import json
    return json.dumps(frames, indent=2)
