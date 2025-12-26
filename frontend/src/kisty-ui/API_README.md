# Keesti Platform API Documentation

## Overview

این مستندات برای توسعه‌دهندگان Backend (NestJS) تهیه شده است. این فایل شامل تمام اطلاعات لازم برای پیاده‌سازی API و Database است.

## Authentication Flow

### 1. Registration with Phone Number
```
POST /api/auth/register
Body: { phone: "09123456789", fullName: "نام کاربر" }
Response: { message: "OTP sent", expiresIn: 120 }
```

### 2. OTP Verification
```
POST /api/auth/verify-otp
Body: { phone: "09123456789", otp: "123456" }
Response: { accessToken: "jwt_token", user: {...} }
```

### 3. Google OAuth
```
POST /api/auth/google
Body: { idToken: "google_id_token" }
Response: { accessToken: "jwt_token", user: {...} }
```

## Role-Based Access Control

### Roles
- **CUSTOMER**: مشتری - می‌تواند پروژه ثبت کند و با تولیدکنندگان ارتباط برقرار کند
- **SUPPLIER**: تولیدکننده - می‌تواند درخواست‌های مرتبط را ببیند و پاسخ دهد
- **ADMIN**: مدیر - دسترسی کامل به تمام بخش‌ها

### Permissions Matrix

| Endpoint | CUSTOMER | SUPPLIER | ADMIN |
|----------|----------|----------|-------|
| GET /projects | فقط پروژه‌های خودش | پروژه‌های مرتبط | همه پروژه‌ها |
| POST /projects | ✓ | ✗ | ✓ |
| GET /users | ✗ | ✗ | ✓ |
| GET /suppliers | ✓ | ✓ | ✓ |
| POST /suppliers/verify | ✗ | ✗ | ✓ |
| GET /messages | ✓ | ✓ | ✓ |
| POST /messages | ✓ | ✓ | ✓ |

## Database Schema

### Entity Relationship Diagram (ERD)

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    User     │─────────│   Project   │─────────│   City      │
│             │         │              │         │             │
│ - id (PK)   │         │ - id (PK)    │         │ - id (PK)   │
│ - phone     │         │ - title      │         │ - name      │
│ - email     │         │ - description│         │ - province  │
│ - fullName  │         │ - customerId │         └─────────────┘
│ - role      │         │ - cityId (FK)│
│ - isActive  │         │ - categoryId │         ┌─────────────┐
│ - isBlocked │         │ - status     │─────────│  Category   │
└─────────────┘         │ - files[]    │         │             │
       │                └──────────────┘         │ - id (PK)   │
       │                         │               │ - name      │
       │                         │               │ - icon      │
       │                         │               └─────────────┘
       │                         │
       │                ┌──────────────┐
       │                │   Message    │
       │                │              │
       │                │ - id (PK)    │
       │                │ - senderId   │
       │                │ - content    │
       │                │ - createdAt  │
       │                └──────────────┘
       │
       │                ┌──────────────┐
       └────────────────│   Review    │
                        │              │
                        │ - id (PK)    │
                        │ - rating     │
                        │ - comment    │
                        └──────────────┘
```

### Tables Structure

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(11) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('CUSTOMER', 'SUPPLIER', 'ADMIN')),
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
```

#### Suppliers Table (extends Users)
```sql
CREATE TABLE suppliers (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  workshop_name VARCHAR(255),
  logo_url VARCHAR(500),
  equipment TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_verified ON suppliers(is_verified);
CREATE INDEX idx_suppliers_featured ON suppliers(is_featured);
```

#### Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES cities(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_customer ON projects(customer_id);
CREATE INDEX idx_projects_city ON projects(city_id);
CREATE INDEX idx_projects_category ON projects(category_id);
CREATE INDEX idx_projects_status ON projects(status);
```

#### Project Files Table
```sql
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_files_project ON project_files(project_id);
```

#### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);
```

#### Conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(participant1_id, participant2_id, project_id)
);

CREATE INDEX idx_conversations_project ON conversations(project_id);
CREATE INDEX idx_conversations_participants ON conversations(participant1_id, participant2_id);
```

#### Reviews Table
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_project ON reviews(project_id);
CREATE INDEX idx_reviews_supplier ON reviews(supplier_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
```

#### Supplier Specialties (Many-to-Many)
```sql
CREATE TABLE supplier_specialties (
  supplier_id UUID NOT NULL REFERENCES suppliers(user_id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (supplier_id, category_id)
);

CREATE INDEX idx_supplier_specialties_supplier ON supplier_specialties(supplier_id);
CREATE INDEX idx_supplier_specialties_category ON supplier_specialties(category_id);
```

#### Supplier Cities (Many-to-Many)
```sql
CREATE TABLE supplier_cities (
  supplier_id UUID NOT NULL REFERENCES suppliers(user_id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  PRIMARY KEY (supplier_id, city_id)
);

CREATE INDEX idx_supplier_cities_supplier ON supplier_cities(supplier_id);
CREATE INDEX idx_supplier_cities_city ON supplier_cities(city_id);
```

#### Cities Table
```sql
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cities_province ON cities(province);
```

#### Categories Table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### OTP Codes Table
```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(11) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otp_phone ON otp_codes(phone);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);
```

## Best Practices for NestJS Implementation

### 1. Project Structure
```
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── google.strategy.ts
│   └── guards/
│       └── jwt-auth.guard.ts
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── entities/
│       └── user.entity.ts
├── projects/
├── messages/
├── reviews/
└── common/
    ├── decorators/
    │   └── roles.decorator.ts
    ├── guards/
    │   └── roles.guard.ts
    └── filters/
        └── http-exception.filter.ts
```

### 2. Use TypeORM or Prisma

**TypeORM Example:**
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 11 })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  fullName: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 3. Role-Based Guards
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    const user = context.switchToHttp().getRequest().user;
    return requiredRoles.includes(user.role);
  }
}
```

### 4. Soft Delete for Important Entities
```typescript
@DeleteDateColumn()
deletedAt: Date;
```

### 5. Pagination
```typescript
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

### 6. File Upload
```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // Upload to S3 or local storage
  return { url: fileUrl };
}
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/keesti
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=keesti_user
DATABASE_PASSWORD=keesti_password
DATABASE_NAME=keesti_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OTP Service (SMS Provider)
OTP_SERVICE_API_KEY=your-otp-api-key
OTP_SERVICE_URL=https://api.otp-provider.com

# File Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=keesti-uploads
AWS_REGION=us-east-1

# App
NODE_ENV=development
PORT=3000
API_PREFIX=/api
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - ثبت نام با شماره موبایل
- `POST /api/auth/verify-otp` - تایید OTP
- `POST /api/auth/google` - ورود با گوگل
- `POST /api/auth/logout` - خروج

### Projects
- `GET /api/projects` - لیست پروژه‌ها (با فیلتر role)
- `POST /api/projects` - ثبت پروژه جدید
- `GET /api/projects/:id` - جزئیات پروژه
- `PUT /api/projects/:id` - به‌روزرسانی پروژه
- `DELETE /api/projects/:id` - حذف پروژه (Admin)

### Users
- `GET /api/users` - لیست کاربران (Admin only)
- `GET /api/users/:id` - جزئیات کاربر
- `PUT /api/users/:id/block` - مسدود کردن کاربر (Admin)
- `PUT /api/users/:id/role` - تغییر نقش (Admin)

### Suppliers
- `GET /api/suppliers` - لیست تولیدکنندگان
- `GET /api/suppliers/:id` - جزئیات تولیدکننده
- `POST /api/suppliers/:id/verify` - تایید تولیدکننده (Admin)
- `POST /api/suppliers/:id/feature` - ویژه کردن (Admin)

### Messages
- `GET /api/messages` - لیست مکالمات
- `GET /api/messages/:conversationId` - پیام‌های یک مکالمه
- `POST /api/messages` - ارسال پیام

### Reviews
- `GET /api/reviews` - لیست نظرات
- `POST /api/reviews` - ثبت نظر
- `PUT /api/reviews/:id/approve` - تایید نظر (Admin)

## Error Handling

همه خطاها باید با فرمت زیر برگردانده شوند:

```json
{
  "error": "BadRequest",
  "message": "شماره موبایل معتبر نیست",
  "statusCode": 400
}
```

## Testing

برای تست API از Postman یا Swagger استفاده کنید. فایل `api-specification.json` را می‌توانید در Swagger Editor باز کنید.

## Deployment

1. Database migration با TypeORM یا Prisma
2. Environment variables را تنظیم کنید
3. Build: `npm run build`
4. Start: `npm run start:prod`

## Notes

- تمام timestamps به UTC ذخیره می‌شوند
- از UUID برای تمام primary keys استفاده کنید
- برای file uploads از S3 یا مشابه استفاده کنید
- Rate limiting برای OTP endpoints اعمال کنید
- Logging برای تمام actions مهم

