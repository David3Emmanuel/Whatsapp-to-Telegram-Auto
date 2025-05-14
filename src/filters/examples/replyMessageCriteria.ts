// Example usage of ReplyMessageCriteria
import { WAMessage } from 'baileys'
import {
  MessageFilter,
  TextContentCriteria,
  RegexCriteria,
  ReplyMessageCriteria,
  SenderCriteria,
  MediaTypeCriteria,
} from '..'

// Example 1: Forward any reply to a specific message
const anyReplyFilter = new MessageFilter(
  'AnyReplyFilter',
  [new ReplyMessageCriteria()], // No criteria specified, matches any reply
)

// Example 2: Forward replies to messages from a specific sender
const replyToSenderFilter = new MessageFilter('ReplyToSenderFilter', [
  new ReplyMessageCriteria(
    undefined, // No criteria for the main message
    new SenderCriteria('123456789@s.whatsapp.net'), // Only when reply is to this sender
  ),
])

// Example 3: Forward replies that contain specific text to media messages
const replyToMediaFilter = new MessageFilter('ReplyToMediaFilter', [
  new ReplyMessageCriteria(
    new TextContentCriteria('important'), // Main message must contain 'important'
    new MediaTypeCriteria(['image', 'video']), // Reply is to an image or video
  ),
])

// Example 4: Forward course-related replies
// Main message has a course code pattern (#ABC 123)
// Reply is to a message containing the word "assignment"
const courseAssignmentFilter = new MessageFilter('CourseAssignmentFilter', [
  new ReplyMessageCriteria(
    new RegexCriteria(/#[A-Z]{3}\s?\d{3}/), // Main message has course code
    new TextContentCriteria('assignment'), // Replied message is about an assignment
  ),
])

// Example 5: Multiple criteria in a filter
const complexFilter = new MessageFilter(
  'ComplexFilter',
  [
    // Either a reply to a course-related message
    new ReplyMessageCriteria(undefined, new RegexCriteria(/#[A-Z]{3}\s?\d{3}/)),
    // Or a message with specific keywords
    new TextContentCriteria('urgent assignment'),
  ],
  'OR', // Use OR mode for the criteria
)

// Testing function that would process a message with these filters
function processMessage(message: WAMessage): void {
  const filters = [
    anyReplyFilter,
    replyToSenderFilter,
    replyToMediaFilter,
    courseAssignmentFilter,
    complexFilter,
  ]

  for (const filter of filters) {
    if (filter.matches(message)) {
      console.log(`Message matched filter: ${filter.getDescription()}`)
      filter.logMatch(message)
      // Process the matched message (e.g., forward to Telegram)
    }
  }
}
