def parse_quantumultx_rules(input_text):
    current_comment = None
    hostnames = []
    rules = []
    
    for line in input_text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith('#'):
            current_comment = line
        elif line.startswith('hostname'):
            parts = line.split('=')
            if len(parts) >= 2:
                hostnames.append(parts[1].strip())
        elif line.startswith('^http'):
            if current_comment:
                rules.append((current_comment, line))
                current_comment = None
    
    output = []
    for comment, rule in rules:
        output.append(f"{comment}\n{rule}")
    
    if hostnames:
        output.append(f"\nhostname = {', '.join(hostnames)}")
    
    return '\n'.join(output)
