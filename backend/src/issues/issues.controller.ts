import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../users/entities/user.entity';

@Controller('issues')
@UseGuards(JwtAuthGuard)
export class IssuesController {
    constructor(private readonly issuesService: IssuesService) { }

    @Post()
    create(@Body() createIssueDto: CreateIssueDto, @CurrentUser() user: UserEntity) {
        return this.issuesService.create(createIssueDto, user);
    }

    @Get()
    findAll(@CurrentUser() user: Omit<UserEntity, 'passwordHash'>) {
        return this.issuesService.findAll(user.id, user.role, user.organizationId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: Omit<UserEntity, 'passwordHash'>) {
        return this.issuesService.findOne(id, user.id, user.role, user.organizationId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateIssueDto: UpdateIssueDto, @CurrentUser() user: Omit<UserEntity, 'passwordHash'>) {
        return this.issuesService.update(id, updateIssueDto, user.id, user.role, user.organizationId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: Omit<UserEntity, 'passwordHash'>) {
        return this.issuesService.remove(id, user.id, user.role, user.organizationId);
    }
}
