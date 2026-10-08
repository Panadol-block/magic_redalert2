import { expect, test } from 'bun:test';
import { Strings } from '../../data/Strings';
import { formatArchiveDownloadProgress } from '../../engine/gameRes/GameResImporter';
import zh from '../../../public/res/locale/zh-CN.json';
import en from '../../../public/res/locale/en-US.json';

for (const [locale, messages] of [['zh', zh], ['en', en]] as const) {
    test(`archive progress accepts numeric formatting in ${locale}`, () => {
        const strings = new Strings(messages);
        expect(formatArchiveDownloadProgress(strings, 1048576, 2097152)).toContain('1.0 MiB / 2.0 MiB');
        expect(formatArchiveDownloadProgress(strings, 1048576, 2097152)).toContain('50%');
        expect(formatArchiveDownloadProgress(strings, 1048576)).toContain('1.0 MiB');
    });
}
