import fs from 'node:fs';
import path from 'node:path';

const configPath = path.resolve('ios/App/App/capacitor.config.json');
const pluginName = 'SignInWithApple';

const raw = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(raw);
const packageClassList = Array.isArray(config.packageClassList) ? config.packageClassList : [];

if (!packageClassList.includes(pluginName)) {
  config.packageClassList = [...packageClassList, pluginName];
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, '\t')}\n`);
}
