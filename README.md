# Renderwise

A very simple Chrome/Edge plugin to apply custom font settings by patching web author fonts with your preferred choices.
I basically wanted something similar to Firefox's `Allow pages to choose their own fonts, instead of your selections above` setting in Chromium browsers.

## Features
- Override web fonts with your preferred font choices, better readability, aesthetics. What ever your preference.
- Easily Enable or disable the extension with a single click, globally and per-site.
- Lightweight and minimal impact on browser performance.
- No data collection or tracking.

## Development

This project includes a development container configuration for VS Code. To use it:

1. Install [Docker](https://www.docker.com/products/docker-desktop)
2. Install the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension in VS Code
3. Open this project in VS Code and click "Reopen in Container" when prompted

The development container includes:
- Node.js 18

To build the package zip, run 
```
npm run package
```

### Continuous Integration

This project uses GitHub Actions for continuous integration. The workflow will:
- Run on every push and pull request to main/master branches
- Build the extension package
- Upload the built zip file as an artifact

You can download the built extension package from the Actions tab in the GitHub repository.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For questions or feedback, please raise issue on Github.
