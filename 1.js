def transform_quantumult_x_rules(input_text):
    """
    将特定格式的 Quantumult X 规则文本转换为新的格式。
    它会收集所有的 hostname 值，并将它们合并到文件末尾的一行中，
    同时保留原始的规则、注释和空行顺序。
    """
    lines = input_text.splitlines()
    
    rule_lines_and_comments = []
    hostnames_list = []
    
    for line in lines:
        # 检查行是否以 "hostname = " 开头
        if line.startswith("hostname = "):
            try:
                # 提取等号后面的主机名部分
                hostname_value = line.split("=", 1)[1].strip()
                if hostname_value: # 确保主机名非空
                    hostnames_list.append(hostname_value)
            except IndexError:
                # 如果行以 "hostname = " 开头但格式不正确，则将其视为普通行
                rule_lines_and_comments.append(line)
        else:
            # 其他所有行（注释、规则、空行等）都按原样添加到列表中
            rule_lines_and_comments.append(line)
            
    # 如果收集到了主机名，则将它们合并并添加到输出列表的末尾
    if hostnames_list:
        combined_hostname_string = "hostname = " + ", ".join(hostnames_list)
        # 在添加主机名前，可以检查最后一个非空规则/注释行后是否有空行，
        # 以决定是否需要在主机名行前加一个空行，但根据示例输出，似乎不需要额外空行。
        # 不过，如果 rule_lines_and_comments 的最后一个元素是空字符串，
        # 并且我们希望主机名紧随其后，而不是隔开更多行，可以考虑去除末尾的空行。
        # 但为了忠实于原始结构并简单处理，我们直接追加。
        # 如果末尾有空行，可以通过 strip() 输出结果或在加入前清理 rule_lines_and_comments 的末尾空行。
        # 按示例，规则块之间有空行，但最后一个规则块和hostname之间没有额外空行。
        
        # 移除末尾可能存在的由原始输入产生的多余空行，确保hostname行之前格式正确
        while rule_lines_and_comments and rule_lines_and_comments[-1].strip() == "":
            rule_lines_and_comments.pop()
        
        # 如果 rule_lines_and_comments 不为空，并且最后一个元素不是空行，
        # 且原始格式的最后一个规则块后没有空行，
        # 则可能需要在规则和hostname之间加一个空行（如果需要的话）。
        # 根据示例，最后一个规则行和hostname行之间没有空行。
        
        rule_lines_and_comments.append(combined_hostname_string)
        
    return "\n".join(rule_lines_and_comments)
