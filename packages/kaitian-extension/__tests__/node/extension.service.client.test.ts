import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { Injector } from '@ali/common-di';
import { AppConfig, INodeLogger } from '@ali/ide-core-node';

import { createNodeInjector } from '../../../../tools/dev-tool/src/injector-helper';
import { IExtensionNodeClientService, IExtensionNodeService } from '../../src/common';
import { ExtensionSeviceClientImpl } from '../../src/node/extension.service.client';
import { ExtensionNodeServiceImpl } from '../../src/node/extension.service';
import { IExtensionStoragePathServer } from '@ali/ide-extension-storage/lib/common';
import { IFileService } from '@ali/ide-file-service/lib/common';
import { FileSystemNodeOptions, FileService } from '@ali/ide-file-service/lib/node';

describe('Extension Client Serivce', () => {
  let injector: Injector;
  let extensionNodeClient: IExtensionNodeClientService;
  const extensionDir = path.join(__dirname, '../__mock__/extensions');
  const testExtId = 'kaitian.ide-dark-theme';
  const testExtPath = 'kaitian.ide-dark-theme-1.13.1';
  const testExtReadme = '# IDE Dark Theme';

  beforeAll(async (done) => {
    injector = createNodeInjector([]);
    injector.addProviders(
      {
        token: AppConfig,
        useValue: {
          marketplace: {
            extensionDir,
            ignoreId: [],
          },
        },
      }, {
      token: INodeLogger,
      useValue: {
        /* tslint:disable */
        log: console.log,
        error: console.error,
        warn: console.warn,
        /* tslint:enable */
      },
    },
    {
      token: IFileService,
      useClass: FileService,
    },
    {
      token: 'FileServiceOptions',
      useValue: FileSystemNodeOptions.DEFAULT,
    },
    {
      token: IExtensionStoragePathServer,
      useValue: {
        getLastStoragePath: () => Promise.resolve(path.join(os.homedir(), '.kaitian', 'workspace-storage')),
      },
    },
      {
        token: IExtensionNodeService,
        useClass: ExtensionNodeServiceImpl,
      },
      {
        token: IExtensionNodeClientService,
        useClass: ExtensionSeviceClientImpl,
      },
    );

    extensionNodeClient = injector.get(IExtensionNodeClientService);
    done();
  });

  describe('get all extensions', () => {
    it('should get all extension and equals dirs', async () => {
      const extensions = await extensionNodeClient.getAllExtensions([extensionDir], [], 'zh-CN', {});
      const dirs = fs.readdirSync(extensionDir);

      expect(extensions.map((e) => path.basename(e.realPath)).sort()).toEqual(dirs.sort());
      expect(extensions.length).toBe(dirs.length);
    });

    it('should get all extension and contains extraMetadata', async () => {
      const extension = await extensionNodeClient.getAllExtensions([extensionDir], [], 'zh_CN', { readme: './README.md' });
      const expectExtension = extension.find((e) => e.id = testExtId);
      expect(expectExtension?.extraMetadata.readme.trim()).toEqual(testExtReadme);
    });
  });

  describe('get extension', () => {
    it('should get first extension', async () => {
      const extension = await extensionNodeClient.getExtension(path.join(extensionDir, testExtPath), 'zh_CN', {});
      expect(path.basename(extension!.realPath)).toBe(testExtPath);
    });

    it('should get a extension and contains extraMetadata', async () => {
      const extension = await extensionNodeClient.getExtension(path.join(extensionDir, testExtPath), 'zh_CN', { readme: './README.md' });
      const readme = fs.readFileSync(path.join(extensionDir, testExtPath, 'README.md'), 'utf8').toString();

      expect(extension!.extraMetadata.readme).toBe(readme);
    });
  });

  describe('language pack', () => {
    it('should generate languagepacks.json and set VSCODE_NLS_CONFIG', async (done) => {
      // download languagepack extension
      const name = 'vscode-language-pack-zh-hans';
      const publisher = 'vscode-extensions';
      const version = '1.37.1';
      const lpPath = path.join(os.homedir(), '.kaitian', 'workspace-storage', 'languagepacks.json');
      // make sure the workspace-storage path is exist

      const targetPath = path.join(extensionDir, `${publisher}.${name}-${version}`);
      await extensionNodeClient.updateLanguagePack('zh-CN', targetPath);
      expect(fs.existsSync(lpPath));
      const content = fs.readFileSync(lpPath, { encoding: 'utf8' });

      expect(!!process.env['VSCODE_NLS_CONFIG']);
      const nlsConfig = JSON.parse(process.env['VSCODE_NLS_CONFIG']!);
      expect(nlsConfig.locale).toBe('zh-cn');
      done();
    });
  });
});