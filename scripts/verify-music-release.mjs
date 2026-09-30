import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { get } from '@vercel/blob';

// Perfect is unchanged from dpl_A19hmuaCfqY5UHqqtt2mj9mwHWzv. Heartless was
// prepared separately from the user-provided video and reviewed locally.
// This metadata contains no lyrics, audio, credentials or user progress.
export const approvedMusicFiles = {
  'manifest.json': '8b65482a87c4b599e2e6ec1a906d4b841b5c802a1e0c53b76c41b460cd472081',
  'audio.mp3': '1ca15127f1a0bdb366a352101f8f79b268118df70d88e380df625f53e749a3b9',
  'heartless/manifest.json': '135aba0aaeaf52e7ed7033b36f68d9e16193b5a87b7f0d959db20c3796483fb9',
  'heartless/audio.mp3': '2eda9866ca57e321901d39378a4e29cafca7fc902933aaaef37daaa3cd158e9a',
  'stay-at-your-house/manifest.json': '4daec8efd5c7c8eb21f91bf3cb9ed17a5a794a13f8a0599a835ce565e2159825',
  'stay-at-your-house/audio.mp3': 'dd2058d8bb819fc3ec67a641d42430ee926362f4af4c8a1bd9927c3ff7902498',
  'stay-at-your-house/video.mp4': 'd098996c0b4e495bb6361ed4a024cc47c2cac754f74dfbf6f38a0cccdb188e38',
  'stay-at-your-house/background.mp4': '49525f327f5bcc19d56907e2a930d1fdcd1902cec271ad78beaeaa9eec27d1e5',
  'buttercup-local/manifest.json': '0b18d240926a837330b84b4eb6b11e5cdec87d09ebec5f5819743f83c3784993',
  'buttercup-local/audio.mp3': '7161652e352f0e722160bcf296775844d6d8e5574af45fa5663eb7465e43616e',
  'buttercup-local/video.mp4': '7a2a587272d61eece75fe857b6be4a46160385d224abbbfd79f9fabecb791bfc',
  'musify-support-1/perfect-local.json': 'd8b7396885189d646e46ace2073267191ff4b2b8e9e8a61c76f65356e2b956cc',
  'musify-support-1/heartless-local.json': '21d856cd69b92dddd7fd6fa1e5ef17525c12e072b80111d10565efdd713a0d0c',
  'musify-support-1/stay-at-your-house-local.json': '663e657b19982d61123558e298c1a8801ea65c0439fe6668311b2e540c4053be',
  'musify-support-1/buttercup-local.json': '6d351fe1d614fb97dc89f3c11986a8a806523574a3226b80fb49958e79d75101',
  'still-into-you/manifest.json': 'b250e607f2fb511859a2b09cc6ab4c1230912986f78b78d0c4eb7078e11efd48',
  'still-into-you/audio.mp3': '9c96fba5f178d0627a597dd58b5f034e55183b044feb0ac4772cff904fa086ac',
  'still-into-you/video.mp4': 'e8e172ecb2bbaa9b87e2bfd1dc962bb68d7be64e6b7656dfe0ec599df3246a30',
  'do-i-wanna-know/manifest.json': 'db26be0c2aee05df76887f1889fffe2b9b7eddc53225d3d98e46bcbeb3b3354a',
  'do-i-wanna-know/audio.mp3': '453d8ec151731ea4737e242884bd92cedcca0367aed1b5b09871f29379d89c9b',
  'do-i-wanna-know/video.mp4': 'ca17be6b742524891fb515931783a93c48f6fc147b7f97e910f404af4407c0c8',
  'she-knows/manifest.json': '90eb9226ac878046141a9cdd5214bf24d4422b57360319cb96de20c004c65fdf',
  'she-knows/audio.mp3': '7d446b5113967a6f5afc7a16ffeba7f7dc550e67786472ee79781b2c8b649329',
  'she-knows/video.mp4': '596904fb88ca93f80ba28e1cea5c2c61654fde9a6658dd3ed0a247e5245d49e8',
  'made-for-loving-you/manifest.json': 'a7cb98ca3a61898f2c159c8fb7688beb77f6efff8e55ddf766219a126c6417df',
  'made-for-loving-you/audio.mp3': '246580fdf0aee3477b9a9669b9154573df984d0196e9917b6aa11f750bd6f105',
  'savage/manifest.json': '6ea42aec5c1b778b0c1ecf6bbbae655ab2348a887c158043b6d922944caa0d68',
  'savage/audio.mp3': '828acc186c1f2083572f73e40ceac0591ec3866f9c778490c85f2d496b9ca6d8',
  'savage/video.mp4': 'f14759dc8b467cf5130bc70dc75851c29cc8bd372da7793763c29912c0920c23',
  'out-of-order/manifest.json': '35004eed07e43cd46d1fa692b1bed47d592dc40dd62f487513a835209738fddf',
  'out-of-order/audio.mp3': '6c1108ab8723441d041c21529ba86deb4c6454a3175c9762e1263b9808eeb384',
  'king-for-a-day/manifest.json': 'f45b4a614ed4e4daaa73133de71223438eb130307c8a50847ab4314b2c33adb7',
  'king-for-a-day/audio.mp3': 'ef9de1860429770d73fac0c5890d991433113fdbf45bdd1aa69b3c155b55fd0d',
  'king-for-a-day/video.mp4': '5f52b21f0367d21f79fb17fb68f014a0d5294e63121d4bf4e3f10e72397ad0f7',
};

export async function verifyMusicRelease(directory = '.music-assets') {
  for (const [name, expected] of Object.entries(approvedMusicFiles)) {
    let bytes;
    try { bytes = await readFile(resolve(directory, name)); }
    catch { throw Error(`Music release is missing ${name}. Restore the reviewed private bundle before deploying.`); }
    if (createHash('sha256').update(bytes).digest('hex') !== expected)
      throw Error(`Music release ${name} differs from the reviewed bundle. Review the change before updating its fingerprint.`);
  }
}

export async function verifyMusicBlob() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw Error('Private music storage credential is missing.');
  for (const [name, expected] of Object.entries(approvedMusicFiles)) {
    const result = await get(`reviewed-v1/${name}`, { access: 'private', token, useCache: false });
    if (!result || result.statusCode !== 200) throw Error(`Reviewed private music blob is missing: ${name}`);
    const hash = createHash('sha256');
    for await (const chunk of result.stream) hash.update(chunk);
    if (hash.digest('hex') !== expected) throw Error(`Reviewed private music blob differs from the approved file: ${name}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.includes('--remote') || (process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN)) {
    await verifyMusicBlob();
    console.log('Reviewed private music blobs verified.');
  } else if (process.env.VERCEL || process.argv.includes('--required')) {
    await verifyMusicRelease();
    console.log('Reviewed music manifest and approved audio verified.');
  }
}
