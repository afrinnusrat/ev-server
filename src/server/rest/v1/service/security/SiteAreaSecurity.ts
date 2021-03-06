import { HttpAssignAssetsToSiteAreaRequest, HttpAssignChargingStationToSiteAreaRequest, HttpSiteAreaConsumptionsRequest, HttpSiteAreaRequest, HttpSiteAreasRequest } from '../../../../../types/requests/HttpSiteAreaRequest';

import Authorizations from '../../../../../authorization/Authorizations';
import ChargingStationSecurity from './ChargingStationSecurity';
import Consumption from '../../../../../types/Consumption';
import { DataResult } from '../../../../../types/DataResult';
import SiteArea from '../../../../../types/SiteArea';
import SiteSecurity from './SiteSecurity';
import UserToken from '../../../../../types/UserToken';
import Utils from '../../../../../utils/Utils';
import UtilsSecurity from './UtilsSecurity';
import sanitize from 'mongo-sanitize';

export default class SiteAreaSecurity {

  public static filterSiteAreaRequestByID(request: any): string {
    return sanitize(request.ID);
  }

  public static filterAssignAssetsToSiteAreaRequest(request: any): HttpAssignAssetsToSiteAreaRequest {
    return {
      siteAreaID: sanitize(request.siteAreaID),
      assetIDs: request.assetIDs.map(sanitize)
    };
  }

  public static filterAssignChargingStationsToSiteAreaRequest(request: any): HttpAssignChargingStationToSiteAreaRequest {
    return {
      siteAreaID: sanitize(request.siteAreaID),
      chargingStationIDs: request.chargingStationIDs.map(sanitize)
    };
  }

  public static filterSiteAreaRequest(request: any): HttpSiteAreaRequest {
    // Filter request
    return {
      ID: sanitize(request.ID),
      WithChargingStations: !request.WithChargeBoxes ? false : sanitize(request.WithChargingStations),
      WithSite: !request.WithSite ? false : sanitize(request.WithSite)
    } as HttpSiteAreaRequest;
  }

  public static filterSiteAreasRequest(request: any): HttpSiteAreasRequest {
    const filteredRequest: HttpSiteAreasRequest = {
      Search: sanitize(request.Search),
      WithSite: !request.WithSite ? false : UtilsSecurity.filterBoolean(request.WithSite),
      WithChargeBoxes: !request.WithChargeBoxes ? false : UtilsSecurity.filterBoolean(request.WithChargeBoxes),
      WithAvailableChargers: !request.WithAvailableChargers ? false : UtilsSecurity.filterBoolean(request.WithAvailableChargers),
      SiteID: sanitize(request.SiteID)
    } as HttpSiteAreasRequest;
    if (request.Issuer) {
      filteredRequest.Issuer = UtilsSecurity.filterBoolean(request.Issuer);
    }
    if (Utils.containsGPSCoordinates([request.LocLongitude, request.LocLatitude])) {
      filteredRequest.LocCoordinates = [
        Utils.convertToFloat(sanitize(request.LocLongitude)),
        Utils.convertToFloat(sanitize(request.LocLatitude))
      ];
      if (request.LocMaxDistanceMeters) {
        request.LocMaxDistanceMeters = Utils.convertToInt(sanitize(request.LocMaxDistanceMeters));
        if (request.LocMaxDistanceMeters > 0) {
          filteredRequest.LocMaxDistanceMeters = request.LocMaxDistanceMeters;
        }
      }
    }
    UtilsSecurity.filterSkipAndLimit(request, filteredRequest);
    UtilsSecurity.filterSort(request, filteredRequest);
    return filteredRequest;
  }

  public static filterSiteAreaConsumptionRequest(request: any): HttpSiteAreaConsumptionsRequest {
    return {
      SiteAreaID: sanitize(request.SiteAreaID),
      StartDate: sanitize(request.StartDate),
      EndDate: sanitize(request.EndDate)
    };
  }

  public static filterSiteAreaUpdateRequest(request: any): Partial<SiteArea> {
    return {
      id: sanitize(request.id),
      ...SiteAreaSecurity._filterSiteAreaRequest(request)
    };
  }

  public static filterSiteAreaCreateRequest(request: any): Partial<SiteArea> {
    return SiteAreaSecurity._filterSiteAreaRequest(request);
  }

  static filterSiteAreaResponse(siteArea: SiteArea, loggedUser: UserToken, forList = false): SiteArea {
    let filteredSiteArea: SiteArea;
    if (!siteArea) {
      return null;
    }
    // Check auth
    if (Authorizations.canReadSiteArea(loggedUser, siteArea.siteID)) {
      filteredSiteArea = {} as SiteArea;
      filteredSiteArea.id = siteArea.id;
      filteredSiteArea.name = siteArea.name;
      filteredSiteArea.issuer = siteArea.issuer;
      filteredSiteArea.siteID = siteArea.siteID;
      filteredSiteArea.maximumPower = siteArea.maximumPower;
      filteredSiteArea.numberOfPhases = siteArea.numberOfPhases;
      filteredSiteArea.voltage = siteArea.voltage;
      filteredSiteArea.numberOfPhases = siteArea.numberOfPhases;
      filteredSiteArea.smartCharging = siteArea.smartCharging;
      filteredSiteArea.accessControl = siteArea.accessControl;
      if (Utils.objectHasProperty(siteArea, 'address')) {
        filteredSiteArea.address = UtilsSecurity.filterAddressRequest(siteArea.address);
      }
      if (siteArea.connectorStats) {
        filteredSiteArea.connectorStats = siteArea.connectorStats;
      }
      if (siteArea.site) {
        filteredSiteArea.site = SiteSecurity.filterSiteResponse(siteArea.site, loggedUser);
      }
      if (siteArea.chargingStations) {
        filteredSiteArea.chargingStations = siteArea.chargingStations.map((chargingStation) =>
          ChargingStationSecurity.filterChargingStationResponse(chargingStation, loggedUser)
        );
      }
      if (Utils.objectHasProperty(siteArea, 'distanceMeters')) {
        filteredSiteArea.distanceMeters = siteArea.distanceMeters;
      }
      // Created By / Last Changed By
      if (Authorizations.canUpdateSiteArea(loggedUser, siteArea.siteID)) {
        UtilsSecurity.filterCreatedAndLastChanged(filteredSiteArea, siteArea, loggedUser);
      }
    }
    return filteredSiteArea;
  }

  static filterMinimalSiteAreaResponse(siteArea: SiteArea, loggedUser: UserToken): SiteArea {
    let filteredSiteArea: SiteArea;
    if (!siteArea) {
      return null;
    }
    // Check auth
    if (Authorizations.canReadSiteArea(loggedUser, siteArea.siteID)) {
      // Set only necessary info
      filteredSiteArea = {} as SiteArea;
      filteredSiteArea.id = siteArea.id;
      filteredSiteArea.name = siteArea.name;
      filteredSiteArea.siteID = siteArea.siteID;
      filteredSiteArea.maximumPower = siteArea.maximumPower;
      filteredSiteArea.voltage = siteArea.voltage;
      filteredSiteArea.numberOfPhases = siteArea.numberOfPhases;
    }
    return filteredSiteArea;
  }

  static filterSiteAreasResponse(siteAreas: DataResult<SiteArea>, loggedUser) {
    const filteredSiteAreas = [];
    if (!siteAreas.result) {
      return null;
    }
    if (!Authorizations.canListSiteAreas(loggedUser)) {
      return null;
    }
    for (const siteArea of siteAreas.result) {
      const filteredSiteArea = SiteAreaSecurity.filterSiteAreaResponse(siteArea, loggedUser);
      if (filteredSiteArea) {
        filteredSiteAreas.push(filteredSiteArea);
      }
    }
    siteAreas.result = filteredSiteAreas;
  }

  static filterSiteAreaConsumptionResponse(siteArea: SiteArea, consumptions: Consumption[], loggedUser: UserToken): SiteArea {
    siteArea.values = [];
    if (!consumptions) {
      consumptions = [];
    }
    const filteredSiteArea = SiteAreaSecurity.filterSiteAreaResponse(siteArea, loggedUser);
    if (consumptions.length === 0) {
      filteredSiteArea.values = [];
      return filteredSiteArea;
    }
    // Clean
    filteredSiteArea.values = consumptions.map((consumption) => ({
      date: consumption.endedAt,
      instantWatts: consumption.instantWatts,
      instantAmps: consumption.instantAmps,
      limitWatts: consumption.limitWatts,
      limitAmps: consumption.limitAmps,
    }));
    return filteredSiteArea;
  }

  private static _filterSiteAreaRequest(request: any): Partial<SiteArea> {
    return {
      name: sanitize(request.name),
      address: UtilsSecurity.filterAddressRequest(request.address),
      image: sanitize(request.image),
      maximumPower: sanitize(request.maximumPower),
      numberOfPhases: sanitize(request.numberOfPhases),
      voltage: sanitize(request.voltage),
      smartCharging: UtilsSecurity.filterBoolean(request.smartCharging),
      accessControl: UtilsSecurity.filterBoolean(request.accessControl),
      siteID: sanitize(request.siteID)
    };
  }
}
