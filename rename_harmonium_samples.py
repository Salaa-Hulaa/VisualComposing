# 修改rename_harmonium_samples.py文件

import os
import re

# 更新音符映射表，添加低音区音符
NOTE_MAP = {
    # 低音区 (2区)
    'c2': 'C2',
    'd2': 'D2',
    'e2': 'E2',
    'f2': 'F2',
    'g2': 'G2',
    'a2': 'A2',
    'b2': 'B2',

    # 中音区 (3区)
    'c3': 'C3',
    'd3': 'D3',
    'e3': 'E3',
    'f3': 'F3',
    'g3': 'G3',
    'a3': 'A3',
    'b3': 'B3',

    # 高音区 (4区)
    'c4': 'C4',
    'd4': 'D4',
    'e4': 'E4',
    'f4': 'F4',
    'g4': 'G4',
    'a4': 'A4',
    'b4': 'B4',

    # 最高音区 (5区)
    'c5': 'C5',
    'd5': 'D5'
}


def rename_samples():
    # 设置目录路径
    directory = r"E:\GitClone\VisualComposing\VisualComposing\public\samples\freesound\harmonium"

    # 获取目录中的所有.wav文件
    wav_files = [f for f in os.listdir(directory) if f.endswith('.wav')]

    for file_name in wav_files:
        # 使用正则表达式找到音符部分
        match = re.search(r'harmonium-([a-g]#?\d)', file_name.lower())
        if match:
            note = match.group(1)
            if note in NOTE_MAP:
                # 创建新的文件名
                new_name = f"harmonium-{NOTE_MAP[note]}.wav"

                # 构建完整的文件路径
                old_path = os.path.join(directory, file_name)
                new_path = os.path.join(directory, new_name)

                # 重命名文件
                try:
                    if not os.path.exists(new_path):
                        os.rename(old_path, new_path)
                        print(f"已重命名: {file_name} -> {new_name}")
                    else:
                        print(f"文件已存在，跳过: {new_name}")
                except Exception as e:
                    print(f"重命名失败 {file_name}: {str(e)}")
            else:
                print(f"未知音符: {note} in {file_name}")
        else:
            print(f"无法解析文件名: {file_name}")


if __name__ == "__main__":
    print("开始重命名采样文件...")
    rename_samples()
    print("重命名完成！")