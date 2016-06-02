import { StdIO } from 'jarvis/interface/IOs';
import Instance from 'jarvis/Instance';

export default function app(name) {
  const io = new StdIO();
  const jarvis = new Instance(io, name);

  jarvis.on('close', () => process.exit(0));
  jarvis.start();
}
