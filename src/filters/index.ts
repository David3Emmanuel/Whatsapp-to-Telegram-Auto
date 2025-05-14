// Export all criteria interfaces and base classes
export {
  IMessageCriteria,
  BaseMessageCriteria,
  MessageFilter,
} from './messageCriteria'

// Export all common criteria implementations
export {
  SenderCriteria,
  TextContentCriteria,
  RegexCriteria,
  MediaTypeCriteria,
  NotCriteria,
  ReplyMessageCriteria,
} from './commonCriteria'
