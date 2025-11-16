# Contributing to Cura AI Platform

Thank you for your interest in contributing! Here's how you can help.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## Development Setup

See [SETUP.md](SETUP.md) for detailed setup instructions.

## Code Style

### Python (Backend)
- Follow PEP 8
- Use type hints
- Write docstrings for functions
- Max line length: 88 characters (Black formatter)

```python
def process_message(message: str, user_id: int) -> dict:
    """
    Process a chat message and generate response.
    
    Args:
        message: User's input message
        user_id: ID of the user
        
    Returns:
        Dictionary containing response data
    """
    # Implementation
    pass
```

### TypeScript (Frontend)
- Use TypeScript strict mode
- Follow Airbnb style guide
- Use functional components with hooks
- Write JSDoc comments

```typescript
/**
 * Send a chat message to the backend
 * @param message - The message content
 * @param settings - Chat settings
 * @returns Promise with response data
 */
async function sendMessage(
  message: string,
  settings: ChatSettings
): Promise<ChatResponse> {
  // Implementation
}
```

## Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```
feat(chat): add streaming response support
fix(auth): resolve token expiration issue
docs(api): update authentication endpoints
```

## Pull Request Process

1. Update documentation for any API changes
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Areas for Contribution

### High Priority
- [ ] Additional language support
- [ ] Enhanced file processing (OCR for images)
- [ ] Voice input/output
- [ ] Mobile-responsive improvements
- [ ] Performance optimizations

### Medium Priority
- [ ] Additional medical datasets
- [ ] Export conversation history
- [ ] User preferences system
- [ ] Advanced analytics dashboard
- [ ] Multi-user collaboration

### Documentation
- [ ] Video tutorials
- [ ] API client examples
- [ ] Deployment guides
- [ ] Use case studies
- [ ] Translation of docs

## Medical Content Guidelines

When adding medical content:

1. **Accuracy**: Only add verified, evidence-based information
2. **Sources**: Always cite authoritative sources
3. **Disclaimers**: Include appropriate medical disclaimers
4. **Privacy**: Never include identifiable patient information
5. **Ethics**: Follow medical ethics guidelines

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Email: contact@cura-ai.example.com

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow ethical guidelines for medical AI

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
