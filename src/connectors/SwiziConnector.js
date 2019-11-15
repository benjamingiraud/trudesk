const axios = require('axios')
// const R = require("ramda");

// const { warn } = require("../../logger")("SwiziConnector");

// const errorData = err => ({
//   config: err.config,
//   responseData: R.path(["response", "data"], err),
// });

module.exports = class SwiziConnector {
  constructor ({ apikey, appId }) {
    let headers = { apikey }
    if (appId) headers.appId = appId + ''
    let baseURL =
      global.env === 'local' || global.env === 'development'
        ? 'https://api-dev.swizi.io/api'
        : 'https://api.swizi.io/api'
    this.axiosInst = axios.create({ baseURL, headers })
  }

  async authenticate (login, password) {
    try {
      const res = await this.axiosInst.post('/userws/auth', {
        login,
        password
      })

      return res.data
    } catch (err) {
      // warn("Failed on authenticate: " + err.message, errorData(err));
      throw Error(err)
    }
  }

  async checkToken (authtoken) {
    try {
      const res = await this.axiosInst.get('/userws/checkToken', {
        headers: { authtoken }
      })

      return res.data
    } catch (err) {
      // warn("Failed on authenticate: " + err.message, errorData(err));
      throw Error(err)
    }
  }

  async findUserById (userId) {
    try {
      const res = await this.axiosInst.get(`/userws/profileById/${userId}`)

      return res.data
    } catch (err) {
      // warn("Failed on findUserById: " + err.message, errorData(err));
      throw Error(err)
    }
  }

  async findUserByIds (userIds, showGroupHierarchy = true) {
    try {
      const res = await this.axiosInst.post('/userws/profileByIds', {
        userIds,
        showGroupHierarchy
      })

      return res.data
    } catch (err) {
      // warn("Failed on findUserByIds: " + err.message, errorData(err));
      throw Error(err)
    }
  }

  async findUserByLogin (login) {
    try {
      const res = await this.axiosInst.get(`/userws/profile/${encodeURIComponent(login)}/`)
      return res.data

      // const res = await this.axiosInst.get("/userws/list", {
      //   params: { search: email },
      // });
      // return res.data[0];
    } catch (err) {
      // if (R.path(["response", "status"], err) === 404) return null;
      // warn("Failed on findUserByLogin: " + err.message, errorData(err));
      throw Error(err)
    }
  }

  async findUsersByGroup (groupId, params) {
    try {
      const res = await this.axiosInst.get(`/userws/list/${groupId}`, {
        params
      })

      return res.data
    } catch (err) {
      // warn("Failed on findUsersByGroup: " + err.message, errorData(err));
      throw Error(err)
    }
  }

  async createAUser (userData) {
    try {
      let user = await this.axiosInst.post('/userws/addUser', userData)

      return user.data
    } catch (err) {
      // warn("Failed on createAUser: " + err.message, errorData(err));
      throw Error(err)
    }
  }

  async updateProfile (userData) {
    try {
      let user = await this.axiosInst.put('/userws/updateProfile', userData)

      return user.data
    } catch (err) {
      // warn("Failed on updateProfile: " + err.message, errorData(err));
      throw Error(err)
    }
  }

  async findGroup ({
    search,
    searchProp,
    searchCustom,
    searchCustomProp,
    rootOnly,
    sort,
    dir,
    page,
    size,
    withCustomProps
  } = {}) {
    try {
      let params = {
        search,
        searchProp,
        searchCustom,
        searchCustomProp,
        rootOnly,
        sort,
        dir,
        page,
        size,
        withCustomProps
      }
      const res = await this.axiosInst.get('/group/list', { params })

      return res.data
    } catch (err) {
      // warn("Failed on findGroup: " + err.message, errorData(err));
      throw Error(err)
    }
  }

  async findGroupById (groupId) {
    try {
      const res = await this.axiosInst.get(`/group/${groupId}`, {
        params: { withCustomProps: true }
      })

      return res.data
    } catch (err) {
      // warn("Failed on findGroupById: " + err.message, errorData(err));
      throw Error(err)
    }
  }

  async createAGroup (groupData) {
    try {
      const res = await this.axiosInst.post('/group/add', groupData)

      return res.data
    } catch (err) {
      // warn("Failed on createAGroup: " + err.message, errorData(err));
      throw Error(err)
    }
  }

  async updateGroup (groupData) {
    try {
      const res = await this.axiosInst.put('/group/update', groupData)

      return res.data
    } catch (err) {
      // warn("Failed on createAGroup: " + err.message, errorData(err));
      throw Error(err)
    }
  }

  async deleteGroupById (groupId) {
    try {
      await this.axiosInst.delete(`/group/${groupId}`)
      return
    } catch (err) {
      // warn("Failed on deleteGroupById: " + err.message, errorData(err));
      // throw Error(err);
    }
  }

  async addUsertoGroup (userId, groupId) {
    try {
      await this.axiosInst.put(`/group/addUser/${groupId}/${userId}`)
      return
    } catch (err) {
      if (err.response.status !== 403) {
        // warn("Failed on addUsertoGroup: " + err.message, errorData(err));
        throw Error(err)
      }
    }
  }

  async removeUserFromGroup (userId, groupId) {
    try {
      await this.axiosInst.put(`/group/removeUser/${groupId}/${userId}`)
      return
    } catch (err) {
      if (err.response.status !== 403) {
        // warn("Failed on removeUserFromGroup: " + err.message, errorData(err));
        throw Error(err)
      }
    }
  }
}
