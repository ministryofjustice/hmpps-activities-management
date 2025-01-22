# Maintenance page

This is based on a Docker nginx container serving a static HTML page for all requests. A Kubernetes deployment and service is temporarily applied to the namespace and the ingress is edited to route all traffic to the maintenance page service.

Based on:
* https://user-guide.cloud-platform.service.justice.gov.uk/documentation/other-topics/maintenance-page.html
* https://github.com/ministryofjustice/cloud-platform-maintenance-page


## How to deploy the maintenance page

### Deploying the maintenance page

From **this directory** run the command to apply the configuration for the maintenance service and deployment:

must be in **./maintenance/page**
### Example for dev namespace (will need to replace with 'prod')
```
kubectl apply -f kubectl_deploy/ -n hmpps-activities-management-dev
```

### Redirecting traffic to the maintenance page

To route traffic to the maintenance page, edit the ingress in place to change
```
backend -> service -> name from `hmpps-activities-management` to `maintenance-page-svc`:
```
### Example for dev namespace (will need to replace with 'prod')
```
kubectl -n hmpps-activities-management-dev edit ingress hmpps-activities-management-v1-2
```

### Redirecting traffic back to the application
To restore access to the application, revert the change made to the ingress. So, edit the ingress again and change
```
backend -> service -> name from maintenance-page-svc back to hmpps-activities-management
```

### Cleaning up

To remove both the maintenance page service and deployment:

### Example for dev namespace (will need to replace with 'prod')
```

kubectl delete -f kubectl_deploy/ -n hmpps-activities-management-dev
```
