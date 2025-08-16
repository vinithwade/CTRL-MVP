# CTRL MVP - Contributing Guide

Thank you for your interest in contributing to CTRL MVP! This guide will help you get started with contributing to the project.

## 🤝 How to Contribute

### Types of Contributions

We welcome contributions in the following areas:

- **🐛 Bug Fixes**: Fix issues and improve stability
- **✨ New Features**: Add new functionality
- **📚 Documentation**: Improve guides and documentation
- **🎨 UI/UX**: Enhance the user interface
- **🧪 Testing**: Add tests and improve test coverage
- **🔧 Tooling**: Improve development tools and workflows
- **🌐 Localization**: Add translations and internationalization
- **📊 Performance**: Optimize performance and efficiency

### Before You Start

1. **Check existing issues** - Search for similar issues before creating new ones
2. **Read the documentation** - Familiarize yourself with the project structure
3. **Set up your environment** - Follow the development setup guide
4. **Join the community** - Connect with other contributors

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Supabase account
- OpenAI API key (for AI features)

### Development Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/CTRL_mvp.git
   cd CTRL_mvp
   ```

2. **Set up the development environment**
   ```bash
   # Install dependencies
   npm run install:all
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your configuration
   
   # Set up database
   ./setup-database.sh
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

4. **Verify everything works**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5001
   - Health check: http://localhost:5001/health

## 🔄 Development Workflow

### 1. Create a Feature Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b bugfix/issue-description

# Or for documentation
git checkout -b docs/documentation-update
```

### 2. Make Your Changes

Follow these guidelines when making changes:

#### Code Style

- **TypeScript**: Use strict mode and proper typing
- **React**: Use functional components with hooks
- **Naming**: Use descriptive names for variables, functions, and components
- **Comments**: Add JSDoc comments for complex functions
- **Formatting**: Use Prettier for consistent formatting

#### File Organization

```
packages/frontend/src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── services/      # API services
├── utils/         # Utility functions
├── types/         # TypeScript types
└── styles/        # CSS styles

packages/backend/src/
├── routes/        # API route handlers
├── services/      # Business logic
├── middleware/    # Express middleware
└── utils/         # Utility functions
```

#### Component Guidelines

```typescript
// Good component structure
import React from 'react'

interface ComponentProps {
  title: string
  onAction?: () => void
}

export function Component({ title, onAction }: ComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
      {onAction && <button onClick={onAction}>Action</button>}
    </div>
  )
}
```

#### API Guidelines

```typescript
// Good API route structure
import express from 'express'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    // Your logic here
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

export default router
```

### 3. Test Your Changes

```bash
# Run frontend tests
cd packages/frontend
npm test

# Run backend tests
cd packages/backend
npm test

# Run all tests
npm run test --workspaces

# Check TypeScript
npx tsc --noEmit

# Run linting
npm run lint
```

### 4. Commit Your Changes

Use conventional commit messages:

```bash
# Format: type(scope): description
git commit -m "feat(frontend): add new user dashboard component"
git commit -m "fix(backend): resolve authentication issue"
git commit -m "docs: update API documentation"
git commit -m "test: add unit tests for user service"
```

#### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 5. Push and Create a Pull Request

```bash
# Push your branch
git push origin feature/your-feature-name

# Create PR on GitHub
# Fill out the PR template
```

## 📋 Pull Request Guidelines

### PR Template

When creating a pull request, use this template:

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring
- [ ] Test addition

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] No breaking changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No console errors
- [ ] No TypeScript errors

## Screenshots (if applicable)
Add screenshots for UI changes

## Additional Notes
Any additional information
```

### PR Review Process

1. **Self-review**: Review your own code before submitting
2. **Tests**: Ensure all tests pass
3. **Documentation**: Update relevant documentation
4. **Screenshots**: Add screenshots for UI changes
5. **Description**: Provide clear description of changes

## 🧪 Testing Guidelines

### Frontend Testing

```typescript
// Component test example
import { render, screen } from '@testing-library/react'
import { Component } from './Component'

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('handles user interactions', () => {
    const mockAction = jest.fn()
    render(<Component title="Test" onAction={mockAction} />)
    
    screen.getByRole('button').click()
    expect(mockAction).toHaveBeenCalled()
  })
})
```

### Backend Testing

```typescript
// API test example
import request from 'supertest'
import app from '../index'

describe('API Endpoint', () => {
  it('returns expected response', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200)
    
    expect(response.body.success).toBe(true)
  })
})
```

### Test Coverage

- Aim for at least 80% test coverage
- Test both success and error cases
- Test edge cases and boundary conditions
- Use meaningful test descriptions

## 📚 Documentation Guidelines

### Code Documentation

```typescript
/**
 * Calculates the total price including tax
 * @param price - The base price
 * @param taxRate - The tax rate as a decimal (e.g., 0.1 for 10%)
 * @returns The total price including tax
 */
export function calculateTotalPrice(price: number, taxRate: number): number {
  return price * (1 + taxRate)
}
```

### README Updates

When adding new features, update:

- Main README.md
- API documentation
- Development guide
- Troubleshooting guide

### API Documentation

For new API endpoints, document:

- Request/response format
- Authentication requirements
- Error codes
- Example usage

## 🎨 UI/UX Guidelines

### Design Principles

- **Consistency**: Follow existing design patterns
- **Accessibility**: Ensure WCAG 2.1 compliance
- **Responsive**: Work on all screen sizes
- **Performance**: Optimize for speed

### Component Guidelines

```typescript
// Use consistent styling
import { cn } from '@/utils/cn'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children 
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-lg font-semibold transition-colors',
        {
          'bg-primary-600 text-white hover:bg-primary-700': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
          'px-3 py-1 text-sm': size === 'sm',
          'px-4 py-2': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        }
      )}
    >
      {children}
    </button>
  )
}
```

## 🔧 Tooling and Automation

### Pre-commit Hooks

```bash
# Install husky for git hooks
npm install -D husky lint-staged

# Configure pre-commit hooks
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

### Linting Configuration

```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "react-hooks/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "no-unused-vars": "error"
  }
}
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## 🐛 Bug Reports

### Before Reporting

1. **Search existing issues** - Check if the bug is already reported
2. **Reproduce the issue** - Ensure you can consistently reproduce it
3. **Check documentation** - Verify it's not a configuration issue
4. **Test in different environments** - Check if it's environment-specific

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS 12.0]
- Browser: [e.g., Chrome 100]
- Node.js: [e.g., 18.0.0]

## Additional Context
Screenshots, logs, etc.
```

## 💡 Feature Requests

### Before Requesting

1. **Check existing features** - Ensure the feature doesn't already exist
2. **Search issues** - Look for similar feature requests
3. **Consider impact** - Think about how it affects the project
4. **Provide use case** - Explain why the feature is needed

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this feature work?

## Alternatives Considered
What other approaches were considered?

## Additional Context
Screenshots, mockups, etc.
```

## 🏷️ Issue Labels

We use the following labels to categorize issues:

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `priority: high`: High priority issues
- `priority: low`: Low priority issues
- `frontend`: Frontend-related changes
- `backend`: Backend-related changes
- `ui/ux`: User interface improvements
- `performance`: Performance improvements
- `security`: Security-related issues

## 🎯 Good First Issues

If you're new to the project, look for issues labeled with `good first issue`. These are typically:

- Documentation improvements
- Simple bug fixes
- UI polish
- Test additions
- Code comments

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and discussions
- **Discord**: For real-time chat and support

### Asking Questions

When asking for help:

1. **Be specific** - Provide clear details about your issue
2. **Include context** - Share relevant code and error messages
3. **Show effort** - Demonstrate what you've already tried
4. **Be patient** - Contributors are volunteers

## 🏆 Recognition

### Contributors

We recognize contributors in several ways:

- **Contributors list** - All contributors are listed in the README
- **Special thanks** - Significant contributors get special recognition
- **Badges** - Contributors receive badges for different types of contributions

### Contribution Levels

- **Bronze**: 1-5 contributions
- **Silver**: 6-20 contributions
- **Gold**: 21+ contributions
- **Platinum**: Core team members

## 📜 Code of Conduct

### Our Standards

- **Be respectful** - Treat everyone with respect
- **Be inclusive** - Welcome people of all backgrounds
- **Be constructive** - Provide helpful, constructive feedback
- **Be collaborative** - Work together for the best outcome

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Other inappropriate conduct

## 📄 License

By contributing to CTRL MVP, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You

Thank you for contributing to CTRL MVP! Your contributions help make this project better for everyone.

---

For questions about contributing, please open an issue or join our community discussions.
