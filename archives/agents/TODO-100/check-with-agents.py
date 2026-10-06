#!/usr/bin/env python3
"""check-agent-reply.py を、.claude/agents/ をコピーした使い捨てディレクトリで動かす。
使い方: python3 check-with-agents.py <担当名> [timeout秒]"""
import importlib.util, os, shutil, sys, tempfile
spec = importlib.util.spec_from_file_location("car", os.path.expanduser("~/.claude/bin/check-agent-reply.py"))
car = importlib.util.module_from_spec(spec); spec.loader.exec_module(car)
agent = sys.argv[1]; timeout = int(sys.argv[2]) if len(sys.argv) > 2 else 400
src = "/home/ytani/work/pentomino-puzzle/.claude/agents"
report = f"archives/agents/TODO-999/{agent}-report.md"
task = (f"~/.claude/agents/*.md の各ファイルについて、frontmatter の description に"
        f"『名指し』の語があるかを rg で確かめ、結果を {report} に書け。コードは直さない。")
prompt = (f"Agent ツールで subagent_type={agent} を 1 回だけ起動し、次を頼め。\n"
          f"依頼文: 「{task}」\n担当の返事が返ったら、そこで終われ。")
tmp = tempfile.mkdtemp(prefix="check-agent-reply-")
try:
    os.makedirs(f"{tmp}/.claude"); shutil.copytree(src, f"{tmp}/.claude/agents")
    stream = car.run_agent(prompt, tmp, timeout)
    if stream is None: print("測れなかった: 時間切れ"); sys.exit(2)
    reply = car.extract_reply(stream)
    if reply is None: print("測れなかった: SubagentHandback が出力に無い"); print(stream[-1500:]); sys.exit(2)
    p = os.path.join(tmp, report)
    text = open(p, encoding="utf-8").read() if os.path.exists(p) else None
    ok, why = car.judge(reply, report, text)
    print(f"担当: {agent}\n返事（{len(reply.strip().splitlines())} 行）:\n{reply}\n---")
    print("合格" if ok else "不合格: " + " / ".join(why)); sys.exit(0 if ok else 1)
finally:
    shutil.rmtree(tmp, ignore_errors=True)
