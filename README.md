# Whatsapp to Telegram Auto Forwarder

This project is a utility that automatically forwards messages from a WhatsApp group to a Telegram group based on specific criteria.

## Current Implementation

Currently, this tool is designed for a specific use case:

- It monitors WhatsApp messages for replies that contain course codes in the format `#AAA 000` (e.g., `#GEG 222`) or `#GENERAL`
- When such a message is detected, it extracts the quoted/replied message
- It forwards the quoted message to a specific Telegram group
- If a valid course code is found, it sends the message to the corresponding topic within the Telegram group
- Course codes are mapped to Telegram topic IDs using the `topic-map.json` file
- Robust error handling with admin notifications and graceful shutdown in case of persistent WhatsApp connection issues

This implementation specifically targets an educational environment where messages from a WhatsApp group need to be categorized into different course-specific topics in a Telegram group.

## Setup

1. Clone this repository
2. Install dependencies with `npm install`
3. Create a `.env` file with the following variables:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_group_chat_id
   TELEGRAM_ADMIN_ID=your_telegram_admin_id
   PORT=3001 # Optional, defaults to 3001
   ```
4. Run the application with `npm run dev` for development or `npm start` for production
5. When starting the app for the first time, scan the WhatsApp QR code to authenticate
   - You can view the QR code in your browser at `http://localhost:3001/qrcode` (or whatever PORT you configured)

### Error Handling

The application includes robust error handling for WhatsApp connection issues:

- Monitors for persistent connection failures and outages
- Sends detailed error notifications to the admin's Telegram ID when critical issues occur
- Gracefully shuts down the server after notifying the admin, preventing prolonged downtime with a non-functional service
- Logs detailed error information to `logs/critical-errors.log` for debugging

## Next Steps in Development

### Main Priority

The primary next step in development is to transform this project into a robust API service:

- **API Service Development**: Expose core functionality through RESTful APIs and WebSocket connections
- **Webhook Integration**: Implement webhook support for real-time notifications of forwarded messages
- **Developer SDK**: Create client libraries for easy integration with other applications
- **API Documentation**: Provide comprehensive documentation with examples and integration guides
- **Authentication System**: Implement secure API keys and token-based authentication

### Additional Improvements

After establishing the API service, the following enhancements are planned:

1. **Configurable Filters**: Create a configuration system to define message filters without code changes
2. **Multiple Destination Support**: Allow forwarding to multiple Telegram groups/channels
3. **User Interface**: Develop a web dashboard for managing forwarding rules and monitoring status
4. **Media Handling Improvements**: Enhance support for various media types (videos, documents, audio)
5. **Bidirectional Communication**: Implement Telegram to WhatsApp forwarding
6. **Persistent Storage**: Add database support for message history and configuration
7. **Advanced Filtering**: Support more complex filtering criteria (time-based, sender-based, etc.)
8. **Health Monitoring**: Add monitoring endpoints and error recovery mechanisms
9. **User Management**: Implement user roles and permissions for the dashboard
10. **Containerization**: Create Docker support for easy deployment

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.
