# Message Filter System

This module provides a flexible system for filtering WhatsApp messages based on various criteria.

## Core Components

### `IMessageCriteria` Interface

Base interface for all message filtering criteria:

```typescript
interface IMessageCriteria {
  matches(message: WAMessage): boolean;
  getDescription(): string;
}
```

### `BaseMessageCriteria` Abstract Class

Abstract base class implementing the `IMessageCriteria` interface:

```typescript
abstract class BaseMessageCriteria implements IMessageCriteria {
  abstract matches(message: WAMessage): boolean;
  abstract getDescription(): string;
}
```

### `MessageFilter` Class

A composite filter that allows combining multiple criteria with logical operations:

```typescript
class MessageFilter {
  constructor(initialCriteria?: IMessageCriteria[], mode: "AND" | "OR" = "AND");
  addCriteria(criteria: IMessageCriteria): MessageFilter;
  useAndMode(): MessageFilter;
  useOrMode(): MessageFilter;
  matches(message: WAMessage): boolean;
  getDescription(): string;
}
```

## Included Criteria Types

- `SenderCriteria`: Filter by message sender
- `TextContentCriteria`: Filter by text content
- `RegexCriteria`: Filter using regular expressions
- `MediaTypeCriteria`: Filter by media type (image, video, etc.)
- `NotCriteria`: Negate another criteria

## Example Usage

### Basic Filter

```typescript
import { MessageFilter, TextContentCriteria } from "./filters";

// Create a filter that matches messages containing "hello"
const filter = new MessageFilter([new TextContentCriteria("hello")]);

// Check if a message matches the filter
if (filter.matches(message)) {
  console.log("Message matches the filter!");
}
```

### Combining Criteria

```typescript
import {
  MessageFilter,
  TextContentCriteria,
  MediaTypeCriteria,
} from "./filters";

// Create a filter that matches messages containing "urgent" AND having an image
const filter = new MessageFilter(
  [new TextContentCriteria("urgent"), new MediaTypeCriteria(["image"])],
  "AND"
);

// OR operation: match messages containing "urgent" OR having an image
const orFilter = new MessageFilter(
  [new TextContentCriteria("urgent"), new MediaTypeCriteria(["image"])],
  "OR"
);
```

### Adding Criteria After Creation

```typescript
import {
  MessageFilter,
  TextContentCriteria,
  SenderCriteria,
  NotCriteria,
} from "./filters";

// Start with a basic filter
const filter = new MessageFilter()
  .addCriteria(new TextContentCriteria("important"))
  .addCriteria(new SenderCriteria("123456789@s.whatsapp.net"))
  .useAndMode();

// Add more criteria later
filter.addCriteria(new NotCriteria(new TextContentCriteria("spam")));
```

### Custom Criteria

You can create custom criteria by extending `BaseMessageCriteria`:

```typescript
import { BaseMessageCriteria } from "./filters";

class TimeOfDayCriteria extends BaseMessageCriteria {
  private startHour: number;
  private endHour: number;

  constructor(startHour: number, endHour: number) {
    super();
    this.startHour = startHour;
    this.endHour = endHour;
  }

  matches(message: WAMessage): boolean {
    const timestamp = message.messageTimestamp || 0;
    const messageDate = new Date(timestamp * 1000);
    const hour = messageDate.getHours();
    return hour >= this.startHour && hour < this.endHour;
  }

  getDescription(): string {
    return `Time between ${this.startHour}:00 and ${this.endHour}:00`;
  }
}
```
