import runSeed from './seed-runner.ts';

runSeed()
  .then(result => {
    if (result.ok) {
      console.log('Seed completed', result);
      process.exit(0);
    }
    console.error('Seed failed', result.message);
    process.exit(1);
  })
  .catch(e => {
    console.error('Seed error', e);
    process.exit(1);
  });