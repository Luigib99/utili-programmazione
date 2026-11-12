import api from './api';

const SERVICE_NAME = 'NomeServizio';
const BASE_ROUTE = '/route/';

//GET
const getService = async (params = {}) => {
  try {
    const response = await api.get(BASE_ROUTE, { params });

    console.log(SERVICE_NAME, {
      '[API]': `GET ${BASE_ROUTE}`,
      params,
      status: response.status
    });

    return response.data;
  } catch (error) {
    console.error(`Errore in ${SERVICE_NAME} GET:`, error.message);
    throw error;
  }
}

//POST
const postService = async (payload = {}) => {
  try {
    const response = await api.post(BASE_ROUTE, payload);

    console.log(SERVICE_NAME, {
      '[API]': `POST ${BASE_ROUTE}`,
      body: payload,
      status: response.status
    });

    return response.data;
  } catch (error) {
    console.error(`Errore in ${SERVICE_NAME} POST:`, error.message);
    throw error;
  }
}

//PATCH
const patchService = async (payload = {}) => {
  try {
    const response = await api.patch(BASE_ROUTE, payload);

    console.log(SERVICE_NAME, {
      '[API]': `PATCH ${BASE_ROUTE}`,
      body: payload,
      status: response.status
    });

    return response.data;
  } catch (error) {
    console.error(`Errore in ${SERVICE_NAME} PATCH:`, error.message);
    throw error;
  }
}

//DELETE
const deleteService = async (payload = {}) => {
  try {
    const response = await api.delete(BASE_ROUTE, { data: payload });

    console.log(SERVICE_NAME, {
      '[API]': `DELETE ${BASE_ROUTE}`,
      body: payload,
      status: response.status
    });

    return response.data;
  } catch (error) {
    console.error(`Errore in ${SERVICE_NAME} DELETE:`, error.message);
    throw error;
  }
}

export {
  getService,
  postService,
  patchService,
  deleteService
};