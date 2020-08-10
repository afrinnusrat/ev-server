import AxiosFactory from '../../../utils/AxiosFactory';
import { AxiosRequestConfig } from 'axios';
import Constants from '../../../utils/Constants';
import TenantStorage from '../../../storage/mongodb/TenantStorage';
import querystring from 'querystring';

export default class BaseApi {
  public baseURL: string;
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async send(httpRequest: AxiosRequestConfig) {
    let httpResponse;
    let tenantID = Constants.DEFAULT_TENANT;
    // Set the base URL
    httpRequest.baseURL = this.baseURL;
    // Set the Query String
    if (httpRequest.data && httpRequest.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
      // Get the Tenant ID
      const tenant = await TenantStorage.getTenantBySubdomain(httpRequest.data.tenant);
      if (tenant) {
        tenantID = tenant.id;
      }
      httpRequest.data = querystring.stringify(httpRequest.data);
    }
    try {
      const axiosInstance = AxiosFactory.getAxiosInstance(tenantID);
      // Execute with Axios
      httpResponse = await axiosInstance(httpRequest);
    } catch (error) {
      // Handle errors
      if (error.response) {
        httpResponse = error.response;
      } else if (error.request) {
        throw error;
      } else {
        throw error;
      }
    }
    // Set response
    const response = {
      status: httpResponse.status,
      statusText: httpResponse.statusText,
      headers: httpResponse.headers,
      data: httpResponse.data
    };
    return response;
  }
}

