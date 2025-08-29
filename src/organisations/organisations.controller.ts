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
  HttpStatus,
  Query
} from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CreateOrganisationDto, UpdateOrganisationDto } from './dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('organisations')
@ApiTags('Organisations')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une organisation' })
  @ApiResponse({ status: 201, description: 'Organisation créée' })
  @Roles('superadmin')
  create(@Body() createOrganisationDto: CreateOrganisationDto) {
    return this.organisationsService.create(createOrganisationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les organisations' })
  @Roles('superadmin')
  findAll() {
    return this.organisationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une organisation' })
  @ApiParam({ name: 'id', type: Number })
  @Roles('superadmin', 'admin')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organisationsService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Statistiques complètes d\'une organisation' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistiques détaillées incluant parcours, progressions, certifications et métriques de performance' 
  })
  @Roles('superadmin', 'admin')
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.organisationsService.getOrganisationStats(id);
  }

  @Get(':id/stats/parcours/:parcoursId')
  @ApiOperation({ summary: 'Statistiques détaillées d\'un parcours spécifique' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'parcoursId', type: Number })
  @ApiQuery({ name: 'periode', required: false, description: 'Période en jours (défaut: 30)' })
  @Roles('superadmin', 'admin')
  getParcoursStats(
    @Param('id', ParseIntPipe) organisationId: number,
    @Param('parcoursId', ParseIntPipe) parcoursId: number,
    @Query('periode') periode?: string
  ) {
    const days = periode ? parseInt(periode) : 30;
    return this.organisationsService.getParcoursStats(organisationId, parcoursId, days);
  }

  @Get(':id/stats/utilisateur/:userId')
  @ApiOperation({ summary: 'Statistiques détaillées d\'un utilisateur spécifique' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'userId', type: Number })
  @Roles('superadmin', 'admin')
  getUserStats(
    @Param('id', ParseIntPipe) organisationId: number,
    @Param('userId', ParseIntPipe) userId: number
  ) {
    return this.organisationsService.getUserStats(organisationId, userId);
  }

  @Get(':id/stats/comparatif')
  @ApiOperation({ summary: 'Comparatif des performances entre parcours' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'periode', required: false, description: 'Période en jours (défaut: 30)' })
  @Roles('superadmin', 'admin')
  getComparatifStats(
    @Param('id', ParseIntPipe) organisationId: number,
    @Query('periode') periode?: string
  ) {
    const days = periode ? parseInt(periode) : 30;
    return this.organisationsService.getComparatifStats(organisationId, days);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Utilisateurs d\'une organisation' })
  @ApiParam({ name: 'id', type: Number })
  @Roles('superadmin', 'admin')
  getOrganisationUsers(@Param('id', ParseIntPipe) id: number) {
    return this.organisationsService.getOrganisationUsers(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une organisation' })
  @ApiParam({ name: 'id', type: Number })
  @Roles('superadmin')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateOrganisationDto: UpdateOrganisationDto
  ) {
    return this.organisationsService.update(id, updateOrganisationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une organisation' })
  @ApiParam({ name: 'id', type: Number })
  @Roles('superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.organisationsService.remove(id);
  }

  @Delete(':id/users/:userId')
  @ApiOperation({ summary: 'Retirer un utilisateur d\'une organisation' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'userId', type: Number })
  @Roles('superadmin', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeUserFromOrganisation(
    @Param('id', ParseIntPipe) organisationId: number,
    @Param('userId', ParseIntPipe) userId: number
  ) {
    return this.organisationsService.removeUserFromOrganisation(organisationId, userId);
  }
}
