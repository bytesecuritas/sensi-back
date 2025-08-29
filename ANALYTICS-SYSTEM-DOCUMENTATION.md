# Système d'Analytics et Reporting - Documentation

## Vue d'ensemble

Système d'analytics complet pour le superadmin offrant des analyses détaillées sur toutes les entités du système de sensibilisation à la cybersécurité.

## Endpoints Principaux

### 1. Tableau de Bord Global
- `GET /analytics/dashboard` - Vue d'ensemble du système
- Paramètres : timeRange, startDate, endDate, limit, chartType

### 2. Rapports d'Organisation
- `GET /analytics/organisations/:id/report` - Rapport détaillé par organisation

### 3. Santé du Système
- `GET /analytics/system/health` - Monitoring système

### 4. Tendances
- `GET /analytics/trends/users` - Croissance utilisateurs
- `GET /analytics/trends/organisations` - Stats organisations
- `GET /analytics/trends/learning-paths` - Stats parcours
- `GET /analytics/trends/certifications` - Stats certifications

### 5. Top Performers
- `GET /analytics/top-performers/organisations` - Meilleures organisations
- `GET /analytics/top-performers/learning-paths` - Parcours populaires

### 6. Export
- `POST /analytics/export` - Export JSON/CSV/Excel/PDF

### 7. Temps Réel
- `GET /analytics/realtime/activity` - Activité en direct

### 8. Prédictions
- `GET /analytics/predictions/engagement` - Forecasting

### 9. Comparaisons
- `GET /analytics/comparative/periods` - Comparaison périodes

## Métriques Clés

- **Utilisateurs** : Croissance, activité, engagement
- **Organisations** : Performance, taux de completion
- **Parcours** : Popularité, efficacité, difficulté
- **Système** : Performance, charge, disponibilité

## Sécurité

- Accès réservé au superadmin
- Authentification JWT obligatoire
- Validation des paramètres
- Protection des données sensibles

## Formats d'Export

- JSON (intégration API)
- CSV (analyse Excel)
- Excel (rapports structurés)
- PDF (rapports formels)

## Périodes Temporelles

- day : 24 dernières heures
- week : 7 derniers jours
- month : 30 derniers jours
- quarter : 3 derniers mois
- year : 12 derniers mois
- Périodes personnalisées
