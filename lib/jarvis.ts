import { StdIO } from './jarvis/interface/IOs';
import Instance from './jarvis/Instance';

function createInstance(name: string): Instance {
  const io = new StdIO();
  const jarvis = new Instance(io, name);

  jarvis.on('close', () => process.exit(0));
  return jarvis;
}

function app(name) {
  const jarvis = createInstance(name);
  jarvis.start();
}

function quoteArgIfNeeded(arg: string): string {
  if (arg.includes(' ')) {
    return `'${arg.replace(/'/g, "\\\\'")}'`;
  } else {
    return arg;
  }
}

function cli(name: string, args: string[]): void {
  const jarvis = createInstance(name);
  const action = args
    .filter(arg => !/^-[a-zA-Z]|--\w+/.test(arg))
    .map(quoteArgIfNeeded)
    .join(' ');
  jarvis.doAction(action)
    .then(
      code => process.exit(code),
      err => {
        console.error(`Error when executing ${args.join(' ')}`, err);
        process.exit(127);
      }
    );
}

export default app;
export {
  cli
};
