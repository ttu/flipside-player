#!/usr/bin/env node

/**
 * E2E Test Runner Script
 *
 * This script:
 * 1. Checks/starts Redis
 * 2. Starts the mock environment (backend + frontend)
 * 3. Waits for services to be ready
 * 4. Runs Playwright tests
 * 5. Cleans up by stopping services
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const http = require('http');
const os = require('os');

const execAsync = promisify(exec);

// Configuration
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5174'; // Backend port (check .env or default 3001)
const BACKEND_ALT_URL = 'http://localhost:3001'; // Alternative backend port
const MAX_WAIT_TIME = 60000; // 60 seconds
const CHECK_INTERVAL = 1000; // 1 second

// Process tracking
let redisContainerId = null;
let backendProcess = null;
let frontendProcess = null;
let cleanupCalled = false;

/**
 * Check if a port is in use
 */
async function isPortInUse(port) {
  return new Promise(resolve => {
    const server = http
      .createServer()
      .listen(port, () => {
        server.close(() => resolve(false));
      })
      .on('error', () => resolve(true));
  });
}

/**
 * Check if a service is responding
 */
async function waitForService(url, serviceName, timeout = MAX_WAIT_TIME) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, res => {
          res.on('data', () => {});
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 500) {
              resolve();
            } else {
              reject(new Error(`Status code: ${res.statusCode}`));
            }
          });
        });

        req.on('error', reject);
        req.setTimeout(2000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });

      console.log(`✅ ${serviceName} is ready`);
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
  }

  throw new Error(`Timeout waiting for ${serviceName} at ${url}`);
}

/**
 * Check if Redis is running (via redis-cli ping from host)
 */
async function checkRedis() {
  try {
    const { stdout } = await execAsync('redis-cli ping');
    if (stdout.trim() === 'PONG') {
      return true;
    }
  } catch (error) {
    // Redis not running or redis-cli not available
  }
  return false;
}

/**
 * Check if Redis container is ready (using docker exec)
 */
async function checkRedisContainerReady(containerId) {
  try {
    const { stdout } = await execAsync(`docker exec ${containerId} redis-cli ping`);
    if (stdout.trim() === 'PONG') {
      return true;
    }
  } catch (error) {
    // Container not ready yet
  }
  return false;
}

/**
 * Check if container is actually running
 */
async function isContainerRunning(containerId) {
  try {
    const { stdout } = await execAsync(`docker ps --filter id=${containerId} --format '{{.ID}}'`);
    return stdout.trim() === containerId;
  } catch (error) {
    return false;
  }
}

/**
 * Check if Redis Docker container is already running
 */
async function checkRedisContainer() {
  try {
    const { stdout } = await execAsync(
      "docker ps --filter 'name=flipside-redis-test' --format '{{.ID}}'"
    );
    const containerId = stdout.trim();
    if (containerId) {
      console.log(`✅ Redis Docker container already running (${containerId.substring(0, 12)})`);
      return containerId;
    }
  } catch (error) {
    // Docker not available or container not running
  }
  return null;
}

/**
 * Start Redis using Docker
 */
async function startRedis() {
  // First check if Redis is already accessible
  const isRunning = await checkRedis();
  if (isRunning) {
    // Check if it's our container or an existing one
    const existingContainer = await checkRedisContainer();
    if (existingContainer) {
      redisContainerId = existingContainer;
      return null; // Already running, no need to start
    }
    console.log('⚠️  Redis is already running (not started by this script)');
    console.log('   Using existing Redis instance');
    return null;
  }

  // Check if Docker is available
  try {
    await execAsync('docker --version');
  } catch (error) {
    console.error('❌ Docker is not available');
    console.error('   Please install Docker: https://www.docker.com/get-started');
    throw new Error('Docker is required to run Redis for tests');
  }

  // Check if container already exists (stopped)
  try {
    const { stdout } = await execAsync(
      "docker ps -a --filter 'name=flipside-redis-test' --format '{{.ID}}'"
    );
    const existingId = stdout.trim();
    if (existingId) {
      console.log('🔄 Starting existing Redis container...');
      await execAsync(`docker start ${existingId}`);
      redisContainerId = existingId;
    } else {
      // Create new container
      console.log('🚀 Starting Redis with Docker...');
      const { stdout: containerId } = await execAsync(
        'docker run -d --name flipside-redis-test -p 6379:6379 redis:7-alpine'
      );
      redisContainerId = containerId.trim();
      console.log(`✅ Redis container started (${redisContainerId.substring(0, 12)})`);
    }
  } catch (error) {
    console.error('❌ Failed to start Redis container:', error.message);
    throw new Error('Failed to start Redis with Docker');
  }

  // Wait for container to be running
  console.log('⏳ Waiting for Redis container to be ready...');
  let containerRunning = false;
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    containerRunning = await isContainerRunning(redisContainerId);
    if (containerRunning) {
      break;
    }
  }

  if (!containerRunning) {
    throw new Error('Redis container failed to start');
  }

  // Wait for Redis to be ready (check both docker exec and host redis-cli)
  let attempts = 0;
  const maxAttempts = 15; // Increased from 10 to 15
  while (attempts < maxAttempts) {
    // Try docker exec first (more reliable)
    const isReady = await checkRedisContainerReady(redisContainerId);
    if (isReady) {
      console.log('✅ Redis is ready');
      return null; // Return null since we're tracking container ID, not process
    }

    // Also try host redis-cli as fallback
    if (attempts > 3) {
      // Only try host redis-cli after a few attempts (gives port time to bind)
      const hostReady = await checkRedis();
      if (hostReady) {
        console.log('✅ Redis is ready (via host)');
        return null;
      }
    }

    if (attempts % 3 === 0) {
      console.log(`   Still waiting... (${attempts + 1}/${maxAttempts})`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }

  // Get container logs for debugging
  try {
    const { stdout: logs } = await execAsync(`docker logs --tail 20 ${redisContainerId}`);
    console.error('\n❌ Redis container logs:');
    console.error(logs);
  } catch (error) {
    // Ignore log fetch errors
  }

  throw new Error(
    `Redis container started but not responding after ${maxAttempts} seconds. Check container logs above.`
  );
}

/**
 * Start backend server
 */
function startBackend() {
  console.log('🚀 Starting backend (mock mode)...');
  const backendProcess = spawn('npm', ['run', 'backend:dev:mock'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, USE_MOCK_SPOTIFY: 'true' },
  });

  backendProcess.stdout.on('data', data => {
    const output = data.toString();
    if (output.includes('listening') || output.includes('ready')) {
      console.log('📡 Backend:', output.trim());
    }
  });

  backendProcess.stderr.on('data', data => {
    const output = data.toString();
    if (output.includes('error') || output.includes('Error')) {
      console.error('Backend error:', output.trim());
    }
  });

  return backendProcess;
}

/**
 * Start frontend server
 */
function startFrontend() {
  console.log('🚀 Starting frontend (mock mode)...');
  const frontendProcess = spawn('npm', ['run', 'frontend:dev:mock'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, VITE_USE_MOCK_SDK: 'true' },
  });

  frontendProcess.stdout.on('data', data => {
    const output = data.toString();
    if (output.includes('Local:') || output.includes('ready')) {
      console.log('🌐 Frontend:', output.trim());
    }
  });

  frontendProcess.stderr.on('data', data => {
    const output = data.toString();
    if (output.includes('error') || output.includes('Error')) {
      console.error('Frontend error:', output.trim());
    }
  });

  return frontendProcess;
}

/**
 * Open Playwright HTML report in browser
 */
async function openReport() {
  try {
    // Playwright HTML report is typically at playwright-report/index.html
    // But we can also use the show-report command which starts a server
    const platform = os.platform();
    let openCommand;

    if (platform === 'darwin') {
      openCommand = 'open';
    } else if (platform === 'win32') {
      openCommand = 'start';
    } else {
      openCommand = 'xdg-open';
    }

    // Use Playwright's show-report command which starts a server and opens browser
    console.log('\n📊 Opening test report...');
    const reportProcess = spawn('npx', ['playwright', 'show-report'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      shell: true,
      detached: true, // Detach so it doesn't block
    });

    // Don't wait for it, let it run in background
    reportProcess.unref();

    // Give it a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Report should open in your browser');
  } catch (error) {
    console.log('⚠️  Could not auto-open report. Run manually: npx playwright show-report');
  }
}

/**
 * Run Playwright tests
 */
async function runTests() {
  console.log('\n🧪 Running Playwright tests...\n');
  return new Promise((resolve, reject) => {
    const testProcess = spawn('npx', ['playwright', 'test'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
    });

    testProcess.on('close', async code => {
      if (code === 0) {
        console.log('\n✅ Tests completed successfully');
        // Open report after successful tests
        await openReport();
        resolve();
      } else {
        console.log(`\n❌ Tests failed with exit code ${code}`);
        // Also open report on failure to see what went wrong
        await openReport();
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });

    testProcess.on('error', error => {
      console.error('❌ Failed to run tests:', error);
      reject(error);
    });
  });
}

/**
 * Cleanup function
 */
async function cleanup() {
  if (cleanupCalled) {
    return;
  }
  cleanupCalled = true;

  console.log('\n🧹 Cleaning up...');

  // Stop frontend first (doesn't depend on Redis)
  if (frontendProcess) {
    console.log('   Stopping frontend...');
    frontendProcess.kill('SIGTERM');
    await new Promise(resolve => {
      frontendProcess.on('exit', resolve);
      setTimeout(resolve, 3000); // Force kill after 3s
    });
  }

  // Stop backend and wait for it to close gracefully
  // This ensures Redis connections are closed before we kill Redis
  if (backendProcess) {
    console.log('   Stopping backend...');
    backendProcess.kill('SIGTERM');
    await new Promise(resolve => {
      backendProcess.on('exit', resolve);
      setTimeout(resolve, 5000); // Give backend time to close Redis connections
    });
    // Give a bit more time for Redis connections to fully close
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Stop Redis Docker container AFTER backend has closed
  // This prevents "Socket closed unexpectedly" errors
  if (redisContainerId) {
    console.log('   Stopping Redis Docker container...');
    try {
      await execAsync(`docker stop ${redisContainerId}`);
      console.log('   ✅ Redis container stopped');
    } catch (error) {
      console.log('   ⚠️  Failed to stop Redis container (may already be stopped)');
    }
  }

  console.log('✅ Cleanup complete');
}

/**
 * Main function
 */
async function main() {
  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('\n\n⚠️  Received SIGINT, cleaning up...');
    await cleanup();
    process.exit(1);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n⚠️  Received SIGTERM, cleaning up...');
    await cleanup();
    process.exit(1);
  });

  try {
    // Step 1: Check/Start Redis with Docker
    await startRedis();

    // Step 2: Start backend
    backendProcess = startBackend();

    // Step 3: Start frontend
    frontendProcess = startFrontend();

    // Step 4: Wait for services to be ready
    console.log('\n⏳ Waiting for services to be ready...');

    // Try backend health check through frontend proxy (more reliable)
    try {
      await waitForService(`${FRONTEND_URL}/api/health`, 'Backend (via proxy)', 30000);
    } catch (error) {
      // Fallback: try direct backend connection
      console.log('   Trying direct backend connection...');
      try {
        await waitForService(`${BACKEND_URL}/api/health`, 'Backend (direct)', 30000);
      } catch (error2) {
        await waitForService(`${BACKEND_ALT_URL}/api/health`, 'Backend (alt port)', 30000);
      }
    }

    await waitForService(FRONTEND_URL, 'Frontend', 30000);

    // Give services a moment to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Run tests
    await runTests();

    // Step 6: Cleanup
    await cleanup();

    console.log('\n✅ All done!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await cleanup();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
