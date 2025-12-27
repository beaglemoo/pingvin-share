# <div align="center"><img  src="https://user-images.githubusercontent.com/58886915/166198400-c2134044-1198-4647-a8b6-da9c4a204c68.svg" width="40"/> </br>Pingvin Share</div>

<div align="center">

[![](https://img.shields.io/badge/Fork_of-stonith404/pingvin--share-blue?style=for-the-badge)](https://github.com/stonith404/pingvin-share)

</div>

---

Pingvin Share is a self-hosted file sharing platform and an alternative for WeTransfer.

This is an actively maintained fork of the [original project](https://github.com/stonith404/pingvin-share) with additional features and improvements.

## ✨ Features

- Share files using a link
- Unlimited file size (restricted only by disk space)
- Set an expiration date for shares
- Secure shares with visitor limits and passwords
- Email recipients
- Reverse shares
- OIDC and LDAP authentication
- Integration with ClamAV for security scans
- Different file providers: local storage and S3

### Fork Enhancements

- **Short Links** - URL shortening with expiration, passwords, and view limits
- **Paste Sharing** - Share text and code snippets with syntax highlighting
- Improved error handling and logging
- Better accessibility (aria-labels)
- React performance optimizations
- Enhanced UI states (loading, empty, error)
- Proxmox LXC installation script

## 🐧 Get to know Pingvin Share

- [Demo](https://pingvin-share.dev.eliasschneider.com)
- [Review by DB Tech](https://www.youtube.com/watch?v=rWwNeZCOPJA)

<img src="https://user-images.githubusercontent.com/58886915/225038319-b2ef742c-3a74-4eb6-9689-4207a36842a4.png" width="700"/>

## ⌨️ Setup

### Installation with Docker (recommended)

1. Download the `docker-compose.yml` file
2. Run `docker compose up -d`

The website is now listening on `http://localhost:3000`, have fun with Pingvin Share 🐧!

> [!TIP]
> Checkout [Pocket ID](https://github.com/stonith404/pocket-id), a user-friendly OIDC provider that lets you easily log in to services like Pingvin Share using Passkeys.

## 📚 Documentation

For more installation options and advanced configurations, please refer to the [documentation](https://stonith404.github.io/pingvin-share).

## 🖤 Contribute

Contributions are welcome! Feel free to open issues or submit pull requests.

For translations and upstream documentation, see the [original project](https://github.com/stonith404/pingvin-share).

## 🙏 Credits

This fork is based on [Pingvin Share](https://github.com/stonith404/pingvin-share) by [stonith404](https://github.com/stonith404). Thanks to all the original contributors!
