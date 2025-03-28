import axios from 'axios'
import * as core from '@actions/core'
import { StackType } from './deployStack'

type EnvVariables = Array<{
  name: string
  value: string
}>

type EndpointId = number

type StackData = {
  Id: number
  Name: string
  EndpointId: EndpointId
  Env: EnvVariables
}

type CreateStackParams = { type: StackType; method: string; endpointId: EndpointId }
type CreateStackBody = { fromAppTemplate: boolean, name: string; stackFileContent: string; swarmID?: string }
type UpdateStackParams = { endpointId: EndpointId }
type UpdateStackBody = {
  env: EnvVariables
  stackFileContent?: string
  prune: boolean
  pullImage: boolean
}

export class PortainerApi {
  private axiosInstance

  constructor(host: string) {
    this.axiosInstance = axios.create({
      baseURL: `${host}/api`
    })
  }

  async login({ username, password }: { username: string; password: string }): Promise<void> {
    const { data } = await this.axiosInstance.post<{ jwt: string }>('/auth', {
      username,
      password
    })
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.jwt}`
  }

  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post('/auth/logout', null, { timeout: 5000 })
    } catch (error) {
      core.info(`Logout failed: ${error}`)
    }
    this.axiosInstance.defaults.headers.common['Authorization'] = ''
  }

  async getStacks(): Promise<StackData[]> {
    const { data } = await this.axiosInstance.get<StackData[]>('/stacks')
    return data
  }

  async createStack(params: CreateStackParams, body: CreateStackBody): Promise<void> {
    await this.axiosInstance.post(`/stacks/create/${params.type === StackType.SWARM ? "swarm": "standalone"}/${params.method}`, body, { params })
  }

  async updateStack(id: number, params: UpdateStackParams, body: UpdateStackBody): Promise<void> {
    await this.axiosInstance.put(`/stacks/${id}`, body, { params })
  }
}
