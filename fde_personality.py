def resolve_personality(cie, ptr):
    return {'handler': ptr, 'encoding': cie.get('personality_enc', 0)}
