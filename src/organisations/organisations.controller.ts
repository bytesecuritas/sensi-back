import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { CreateOrganisationDto, UpdateOrganisationDto } from './dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('organisations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Post()
  @Roles('superadmin')
  create(@Body() createOrganisationDto: CreateOrganisationDto) {
    return this.organisationsService.create(createOrganisationDto);
  }

  @Get()
  @Roles('superadmin')
  findAll() {
    return this.organisationsService.findAll();
  }

  @Get(':id')
  @Roles('superadmin')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organisationsService.findOne(id);
  }

  @Get(':id/stats')
  @Roles('superadmin')
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.organisationsService.getOrganisationStats(id);
  }

  @Get(':id/users')
  @Roles('superadmin', 'admin')
  getOrganisationUsers(@Param('id', ParseIntPipe) id: number) {
    return this.organisationsService.getOrganisationUsers(id);
  }

  @Patch(':id')
  @Roles('superadmin')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateOrganisationDto: UpdateOrganisationDto
  ) {
    return this.organisationsService.update(id, updateOrganisationDto);
  }

  @Delete(':id')
  @Roles('superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.organisationsService.remove(id);
  }

  @Delete(':id/users/:userId')
  @Roles('superadmin', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeUserFromOrganisation(
    @Param('id', ParseIntPipe) organisationId: number,
    @Param('userId', ParseIntPipe) userId: number
  ) {
    return this.organisationsService.removeUserFromOrganisation(organisationId, userId);
  }
}
