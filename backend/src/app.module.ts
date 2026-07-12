import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AiController } from './ai/ai.controller';
import { AiService } from './ai/ai.service';
import { AiRateLimitService } from './ai/ai-rate-limit.service';
import { User, UserSchema } from './users/schemas/user.schema';
import { Entry, EntrySchema } from './entries/schemas/entry.schema';
import { EntriesController } from './entries/entries.controller';
import { EntriesService } from './entries/entries.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/caloriassync'),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Entry.name, schema: EntrySchema }
    ])
  ],
  controllers: [AppController, AuthController, AiController, EntriesController],
  providers: [AppService, AuthService, AiService, AiRateLimitService, EntriesService, JwtAuthGuard],
})
export class AppModule {}
