# Contributing to MeTube

Thank you for your interest in contributing to MeTube! We welcome contributions from everyone. This document will guide you through the process.

## 🚀 Getting Started

### Prerequisites
- Git installed on your machine
- A GitHub account
- Basic knowledge of HTML, CSS, and JavaScript
- A code editor (VS Code recommended)

### Setting Up Your Development Environment

1. **Fork the Repository**
   - Click the "Fork" button at the top right of the repository page
   - This creates a copy of the repository in your GitHub account

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/MeTube.git
   cd MeTube
   ```

3. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/Open-Source-Chandigarh/MeTube.git
   ```

4. **Open in Browser**
   - Simply open `index.html` in your browser
   - Or use a local server like Live Server extension in VS Code

## 🔄 Making Changes

### 1. Create a New Branch
Always create a new branch for your changes:
```bash
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

**Branch Naming Convention:**
- `feat/feature-name` - For new features
- `fix/bug-name` - For bug fixes
- `docs/doc-name` - For documentation updates
- `style/style-name` - For UI/styling changes
- `refactor/refactor-name` - For code refactoring

### 2. Make Your Changes
- Write clean, readable code
- Follow the existing code style
- Test your changes thoroughly
- Ensure your code works in different browsers (Chrome, Firefox, Safari, Edge)

### 3. Commit Your Changes
```bash
git add .
git commit -m "feat: add your feature description"
```

**Commit Message Format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, semicolons, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### 4. Push to Your Fork
```bash
git push origin feature/your-feature-name
```

### 5. Create a Pull Request
1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill in the PR template with details about your changes
4. Submit the pull request

## 📝 Pull Request Guidelines

### PR Title Format
Use descriptive titles with conventional commit prefixes:
- ✅ `feat: Add voice search functionality`
- ✅ `fix: Resolve dark mode toggle issue`
- ✅ `docs: Update README with installation steps`

### PR Description
Include the following in your PR description:
- **What**: Brief description of changes
- **Why**: Reason for the changes
- **How**: How you implemented it
- **Screenshots**: If UI changes are involved
- **Testing**: How you tested your changes

### Example PR Description
```markdown
## Description
Added voice search functionality to the search bar.

## Changes Made
- Added microphone button to search input
- Implemented Web Speech API integration
- Added voice search modal with real-time transcription
- Added dark mode support for voice search UI

## Screenshots
[Add screenshots here]

## Testing
- Tested in Chrome, Edge, and Safari
- Tested voice recognition with different accents
- Tested in both light and dark modes
- Verified responsiveness on mobile devices
```

## 🎨 Code Style Guidelines

### HTML
- Use semantic HTML5 elements
- Add proper `alt` attributes to images
- Include ARIA labels for accessibility
- Indent with 4 spaces

### CSS
- Use meaningful class names
- Follow BEM naming convention when appropriate
- Group related properties together
- Add comments for complex styles
- Support both light and dark modes

### JavaScript
- Use `const` and `let`, avoid `var`
- Use descriptive variable names
- Add comments for complex logic
- Handle errors gracefully
- Follow ES6+ standards

## 🐛 Reporting Issues

### Before Creating an Issue
- Search existing issues to avoid duplicates
- Check if the issue exists in the latest version
- Try to reproduce the issue

### Creating an Issue
Include the following information:
- **Clear title**: Describe the issue briefly
- **Description**: Detailed explanation of the issue
- **Steps to reproduce**: How to recreate the issue
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Browser/OS**: Your environment details

## ✅ Testing

Before submitting your PR:
- [ ] Test in multiple browsers
- [ ] Test in both light and dark modes
- [ ] Test on mobile and desktop
- [ ] Ensure no console errors
- [ ] Verify all links work
- [ ] Check that the code is properly formatted

## 🎯 What to Contribute

### Good First Issues
- UI/UX improvements
- Documentation updates
- Bug fixes
- Adding comments to code
- Accessibility improvements

### Feature Ideas
- Video playback features
- Playlist functionality
- Search filters
- User preferences
- Keyboard shortcuts
- Social sharing
- Download options

### Areas That Need Help
- Cross-browser compatibility
- Performance optimization
- Accessibility improvements
- Mobile responsiveness
- Test coverage

## 📚 Resources

- [HTML Documentation](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [CSS Documentation](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [JavaScript Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## 💡 Tips for Success

1. **Start Small**: Begin with small contributions to understand the codebase
2. **Ask Questions**: Don't hesitate to ask for help in issues or discussions
3. **Be Patient**: Reviews may take time
4. **Stay Updated**: Keep your fork synced with the main repository
5. **Have Fun**: Enjoy the process of learning and contributing!

## 📞 Getting Help

If you need help:
- Check existing issues and discussions
- Read the documentation thoroughly
- Ask questions in the issue comments
- Join our community discussions

## 🎉 Thank You!

Your contributions make MeTube better for everyone. We appreciate your time and effort!

Happy Coding! 🚀
