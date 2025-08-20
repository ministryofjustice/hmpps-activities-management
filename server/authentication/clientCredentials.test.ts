import generateOauthClientToken from './clientCredentials'

describe('generateOauthClientToken', () => {
  it('Token can be generated', () => {
    expect(generateOauthClientToken('bob', 'password1')).toBe('Basic Ym9iOnBhc3N3b3JkMQ==')
  })

  it('Token can be generated with default config', () => {
    expect(generateOauthClientToken()).toBe(
      'Basic YWN0aXZpdGllcy1tYW5hZ2VtZW50LWNsaWVudC0xOnQyVmViVG1BZSZURm89NWJiPDJnK0ItRXY4SHhheEF0MSpNVmRsZG5yR2xkKSshM0JuQUQ8KGF5LDprTA==',
    )
  })

  it('Token can be generated with special characters', () => {
    const value = generateOauthClientToken('bob', "p@'s&sw/o$+ rd1")
    const decoded = Buffer.from(value.substring(6), 'base64').toString('utf-8')

    expect(decoded).toBe("bob:p@'s&sw/o$+ rd1")
  })
})
