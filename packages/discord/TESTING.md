# Discord Bot Testing Guide

## Overview

This document describes the testing strategy and how to run tests for the Discord bot.

## Test Structure

```
tests/
├── services/
│   ├── user.service.test.ts
│   └── api.service.test.ts
├── handlers/
│   └── challenge.handler.test.ts
├── utils/
│   └── format.test.ts
└── commands/
    (Integration tests for commands)
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

Coverage reports will be generated in the `coverage/` directory.

## Test Coverage

Current test coverage includes:

### Services
- ✅ **UserService** - User mapping management
  - Loading and saving mappings
  - Creating and deleting mappings
  - User registration checks
  - Backend user ID retrieval

- ✅ **ApiService** - Backend API client
  - User creation and retrieval
  - Skills management
  - Enrollment operations
  - Challenge operations (pending, history, submit)
  - Health checks

### Utilities
- ✅ **Format Utils** - Message formatting
  - Challenge embeds
  - Answer result embeds
  - Skills list embeds
  - History embeds
  - User stats embeds
  - Error and success embeds

### Handlers
- ✅ **ChallengeHandler** - Challenge presentation and answer handling
  - Sending challenges via DM
  - Button interaction handling
  - Answer submission
  - Active challenge tracking

## Testing Best Practices

### Mocking
We use Jest mocks for external dependencies:
- File system operations (`fs.promises`)
- HTTP requests (`axios`)
- Discord.js objects (Users, Interactions, etc.)

Example:
```typescript
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
```

### Test Structure
Each test follows the AAA pattern:
- **Arrange**: Set up test data and mocks
- **Act**: Execute the function being tested
- **Assert**: Verify the results

Example:
```typescript
it('should create a new user', async () => {
  // Arrange
  const mockUser = { id: 'user123', timezone: 'UTC' };
  mockedClient.post.mockResolvedValue({ data: mockUser });

  // Act
  const result = await apiService.createUser({ timezone: 'UTC' });

  // Assert
  expect(result).toEqual(mockUser);
});
```

### Test Isolation
- Each test is independent
- `beforeEach` clears all mocks
- No shared state between tests

## Manual Testing

### Prerequisites
1. Backend API running at `http://localhost:3000`
2. Discord bot running with valid credentials
3. Test Discord server with bot added

### Test Scenarios

#### 1. User Registration
```
/register
- Fill out timezone, quiet hours, max challenges
- Verify user created in backend
- Verify mapping saved
```

#### 2. Skills Management
```
/skills
- Verify all skills displayed
- Check enrollment status indicators
```

#### 3. Enrollment
```
/enroll skill:JavaScript difficulty:5
- Verify enrollment success message
- Check backend has enrollment record
```

#### 4. Challenge Flow
```
/challenge
- Verify challenge sent via DM
- Click answer button
- Verify result displayed with explanation
- Check answer recorded in backend
```

#### 5. History
```
/history limit:5
- Verify past challenges displayed
- Test pagination buttons
- Check data matches backend
```

#### 6. Status
```
/status
- Verify enrolled skills shown
- Check stats (total challenges, accuracy)
```

#### 7. Automated Scheduler
```
Wait for :05 or :35 past the hour
- Verify challenges sent automatically
- Check rate limiting (max 1 per hour)
- Verify only users with pending challenges receive notifications
```

## Integration Testing

### Setting up Test Environment
1. Use a test database
2. Create test users and skills
3. Set environment variables for testing:
```env
BACKEND_API_URL=http://localhost:3000/api
BACKEND_API_KEY=test_key
DISCORD_BOT_TOKEN=test_token
```

### Running Integration Tests
```bash
# Run backend in test mode
cd packages/backend
npm run dev

# Run Discord bot tests
cd packages/discord
npm test
```

## Troubleshooting Tests

### Tests failing due to timeouts
Increase Jest timeout in `jest.config.js`:
```javascript
testTimeout: 10000, // 10 seconds
```

### Mocking issues
Ensure mocks are cleared before each test:
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Type errors in tests
Install missing type definitions:
```bash
npm install --save-dev @types/jest @types/node
```

## CI/CD Integration

Tests should be run automatically in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v2
```

## Future Improvements

- Add E2E tests using Discord bot testing framework
- Increase code coverage to >80%
- Add performance tests for scheduler
- Add load tests for concurrent users
- Mock Discord.js client for full integration tests

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Discord.js Guide - Testing](https://discordjs.guide/popular-topics/testing.html)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
