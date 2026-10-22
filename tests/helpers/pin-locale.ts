// The UI locale falls back to the OS locale when config sets none. Pin it so
// assertions on catalog text don't depend on the machine running the tests.
process.env.LC_ALL = 'zh_CN.UTF-8';
