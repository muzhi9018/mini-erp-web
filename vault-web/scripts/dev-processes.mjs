import { spawn } from 'node:child_process';

export function runDevProcesses(applications) {
  // Nested launchers inherit their parent's group so it can also stop orphaned Umi forks.
  const grouped =
    process.platform !== 'win32' && process.env.MINI_ERP_DEV_MANAGED !== '1';
  const children = [];
  let stopping = false;

  function signal(child, value) {
    if (!child.pid) return false;
    try {
      if (grouped) {
        process.kill(-child.pid, value);
        return true;
      }
      if (child.exitCode !== null || child.signalCode !== null) return false;
      return child.kill(value);
    } catch (error) {
      // Darwin can return EPERM for our own group when only zombies remain.
      if (
        error.code === 'ESRCH' ||
        (grouped && process.platform === 'darwin' && error.code === 'EPERM')
      )
        return false;
      throw error;
    }
  }

  function stop(code) {
    if (stopping) return;
    stopping = true;
    process.exitCode = code;
    for (const child of children) signal(child, 'SIGTERM');
    // Keep the launcher alive even if Umi's CLI exits before its server does.
    const force = setTimeout(() => {
      for (const child of children) signal(child, 'SIGKILL');
      clearInterval(waiting);
    }, 3000);
    const waiting = setInterval(() => {
      if (children.some((child) => signal(child, 0))) return;
      clearTimeout(force);
      clearInterval(waiting);
    }, 50);
  }

  for (const name of ['SIGINT', 'SIGTERM']) process.on(name, () => stop(0));

  for (const application of applications) {
    const child = spawn(
      process.execPath,
      [application.entry, ...(application.args || [])],
      {
        cwd: application.cwd,
        detached: grouped,
        stdio: 'inherit',
        env: {
          ...process.env,
          ...application.env,
          MINI_ERP_DEV_MANAGED: '1',
        },
      },
    );
    children.push(child);
    child.on('error', (error) => {
      console.error(`${application.name} 启动失败：${error.message}`);
      stop(1);
    });
    child.on('exit', (code) => {
      if (stopping) return;
      console.error(`${application.name} 已退出，正在停止本次开发服务。`);
      stop(code ?? 1);
    });
  }
}
