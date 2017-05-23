//
// template-rt.cpp
//

#define _CRT_SECURE_NO_WARNINGS
#include "matm.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

struct Ray
{
    vec4 origin;
    vec4 dir;
};

// TODO: add structs for spheres, lights and anything else you may need.

struct Sphere
{
    string name;
    vec4 origin;
    vec3 scale;
    vec3 rgb;
    float k_a;				// Ambient coeffecient
    float k_d;				// Diffuse coeffecient
    float k_s;				// Specular coeffecient
    float k_r;				// Reflective coeffecient
    float shine;				// Shininess
    mat4 sphereTrans;
    mat4 invSphereTrans;
};

struct Light
{
    string name;
    vec4 origin;
    vec3 rgb;
};

struct Intersect
{
    vec4 pt_pos;		// Point position of intersect
    vec4 vec_norm;		// Normal vector at intersect
    float dist;		// Distance of intersect point from camera
    int sphere_num;	// Index of sphere that intersect occurred on
};

int g_width;
int g_height;
vector<vec4> g_colors;


vec3 g_background;
vec3 g_ambient;

float g_left;
float g_right;
float g_top;
float g_bottom;
float g_near;

// Spheres
vector<Sphere> spheres;
int sphere_index = 0;

// Lights
vector<Light> lights;
int light_index = 0;

// Output filename
char *outPut;

int g_recurse = 3;

// -------------------------------------------------------------------
// Input file parsing
inline vec3 toVec3(vec4 in)
{
    return vec3(in[0], in[1], in[2]);
}

vec4 toVec4(const string& s1, const string& s2, const string& s3)
{
    stringstream ss(s1 + " " + s2 + " " + s3);
    vec4 result;
    ss >> result.x >> result.y >> result.z;
    result.w = 1.0f;
    return result;
}

float toFloat(const string& s)
{
    stringstream ss(s);
    float f;
    ss >> f;
    return f;
}

void parseLine(const vector<string>& vs)
{
    //TODO: add parsing of NEAR, LEFT, RIGHT, BOTTOM, TOP, SPHERE, LIGHT, BACK, AMBIENT, OUTPUT.
    const int num_labels = 11;	//0		 1		 2		   3	   4	  5		  6			7		8		  9			10
    const string labels[] = { "NEAR", "LEFT", "RIGHT", "BOTTOM", "TOP", "RES", "SPHERE", "LIGHT", "BACK", "AMBIENT", "OUTPUT" };
    unsigned label_id = find( labels, labels + num_labels, vs[0] ) - labels;
    
    switch (label_id)
    {
        case 0:		// NEAR
            g_near = toFloat(vs[1]);
            break;
        case 1:		// LEFT
            g_left = toFloat(vs[1]);
            break;
        case 2:		// RIGHT
            g_right = toFloat(vs[1]);
            break;
        case 3:		// BOTTOM
            g_bottom = toFloat(vs[1]);
            break;
        case 4:		// TOP
            g_top = toFloat(vs[1]);
            break;
        case 5:		// RES
            g_width = (int)toFloat(vs[1]);
            g_height = (int)toFloat(vs[2]);
            g_colors.resize(g_width * g_height);
            break;
        case 6:		// SPHERE
            spheres.push_back(Sphere());
            spheres[sphere_index].name = vs[1];
            spheres[sphere_index].origin = toVec4(vs[2], vs[3], vs[4]);
            spheres[sphere_index].scale = vec3(toFloat(vs[5]), toFloat(vs[6]), toFloat(vs[7]));
            spheres[sphere_index].rgb = vec3(toFloat(vs[8]), toFloat(vs[9]), toFloat(vs[10]));
            spheres[sphere_index].k_a = toFloat(vs[11]);
            spheres[sphere_index].k_d = toFloat(vs[12]);
            spheres[sphere_index].k_s = toFloat(vs[13]);
            spheres[sphere_index].k_r = toFloat(vs[14]);
            spheres[sphere_index].shine = toFloat(vs[15]);
            
            //sphere transform
            spheres[sphere_index].sphereTrans = Translate(spheres[sphere_index].origin) * Scale(spheres[sphere_index].scale);
            
            //inverse sphere transform
            InvertMatrix(spheres[sphere_index].sphereTrans, spheres[sphere_index].invSphereTrans);
            
            sphere_index++;
            break;
        case 7:		// LIGHT
            lights.push_back(Light());
            lights[light_index].name = vs[1];
            lights[light_index].origin = toVec4(vs[2], vs[3], vs[4]);
            lights[light_index].rgb = vec3(toFloat(vs[5]), toFloat(vs[6]), toFloat(vs[7]));
            
            light_index++;
            break;
        case 8:		// BACK
            g_background = vec3(toFloat(vs[1]), toFloat(vs[2]), toFloat(vs[3]));
            break;
        case 9:		// AMBIENT
            g_ambient = vec3(toFloat(vs[1]), toFloat(vs[2]), toFloat(vs[3]));
            break;
        case 10:	// OUTPUT
            int len = vs[1].length();
            outPut = (char*)malloc(len+1);
            for (int i = 0; i < len; i++) {
                outPut[i] = vs[1][i];
            }
            outPut[len] = '\0';
            break;
    }
}

void loadFile(const char* filename)
{
    ifstream is(filename);
    if (is.fail())
    {
        cout << "Could not open file " << filename << endl;
        exit(1);
    }
    string s;
    vector<string> vs;
    while(!is.eof())
    {
        vs.clear();
        getline(is, s);
        istringstream iss(s);
        while (!iss.eof())
        {
            string sub;
            iss >> sub;
            vs.push_back(sub);
        }
        parseLine(vs);
    }
}


// -------------------------------------------------------------------
// Utilities

void setColor(int ix, int iy, const vec4& color)
{
    int iy2 = g_height - iy - 1; // Invert iy coordinate.
    g_colors[iy2 * g_width + ix] = color;
}


// -------------------------------------------------------------------
// Intersection routine

// TODO: add your ray-sphere intersection routine here.
bool intersectRay(const Ray &ray, Intersect &intersect)
{
    bool intersection_found = false;
    Ray intersectRay;
    float determinant;
    float solution[2] = { 0, 0 };
    vector<Intersect> intersectList;
    int intersect_num = 0;
    float c_squared;
    
    // For each sphere
    for (int i = 0; i < sphere_index; i++)
    {
        // Find inverse transform ray
        intersectRay.origin = (spheres[i].invSphereTrans * ray.origin);
        intersectRay.dir = (spheres[i].invSphereTrans * ray.dir);
        
        // Find intersection of inverse transformed ray with unit sphere at origin
        // Use quadratic to find determinant
        c_squared = dot(intersectRay.dir, intersectRay.dir);
        determinant = pow(dot(toVec3(intersectRay.origin), toVec3(intersectRay.dir)), 2) - c_squared * (dot(toVec3(intersectRay.origin), toVec3(intersectRay.origin)) - 1);
        
        // Analyze determinant to find number of intersection points
        if (determinant > 0)
        {
            // If determinant > 0, two intersect
            // Get two solutions and find associated intersections
            solution[0] = -1 * (dot(toVec3(intersectRay.origin), toVec3(intersectRay.dir)) + sqrt(determinant)) / c_squared;
            solution[1] = -1 * (dot(toVec3(intersectRay.origin), toVec3(intersectRay.dir)) - sqrt(determinant)) / c_squared;
            
            // first intersection of the sphere
            if ((ray.origin + solution[0] * ray.dir).z <= -g_near && solution[0] >= 0.0001f)
            {
                intersectList.push_back(Intersect());
                intersectList[intersect_num].pt_pos = ray.origin + solution[0] * ray.dir;
                intersectList[intersect_num].vec_norm = vec4(normalize((toVec3(intersectList[intersect_num].pt_pos) - toVec3(spheres[i].origin)) / dot(spheres[i].scale , spheres[i].scale)), 0.0);	                intersectList[intersect_num].dist = length(toVec3(intersectList[intersect_num].pt_pos) - toVec3(ray.origin));
                intersectList[intersect_num].sphere_num = i;
                intersect_num++;
                intersection_found = true;
            }
            
            // second intersection of the sphere
            if ((ray.origin + solution[1] * ray.dir).z <= -g_near && solution[1] >= 0.0001f)
            {
                intersectList.push_back(Intersect());
                intersectList[intersect_num].pt_pos = ray.origin + solution[1] * ray.dir;
                intersectList[intersect_num].vec_norm = vec4(normalize((toVec3(intersectList[intersect_num].pt_pos) - toVec3(spheres[i].origin)) / dot(spheres[i].scale , spheres[i].scale) ) , 0.0);
                intersectList[intersect_num].dist = length(toVec3(intersectList[intersect_num].pt_pos) - toVec3(ray.origin));
                intersectList[intersect_num].sphere_num = i;
                intersect_num++;
                intersection_found = true;
            }
        }
        else if (determinant == 0)
        {
            // If determinant = 0, one intersect
            // Get one solution and find associated intersection
            solution[0] = -1 * (dot(toVec3(intersectRay.origin), toVec3(intersectRay.dir)) + sqrt(determinant)) / c_squared;
            
            // only intersection of the sphere
            if ((ray.origin + solution[0] * ray.dir).z <= -g_near && solution[0] >= 0.0001f)
            {
                intersectList.push_back(Intersect());
                intersectList[intersect_num].pt_pos = ray.origin + solution[0] * ray.dir;
                intersectList[intersect_num].vec_norm = vec4(normalize((toVec3(intersectList[intersect_num].pt_pos) - toVec3(spheres[i].origin)) / dot(spheres[i].scale , spheres[i].scale)), 0.0);
                intersectList[intersect_num].dist = length(toVec3(intersectList[intersect_num].pt_pos) - toVec3(ray.origin));
                intersectList[intersect_num].sphere_num = i;
                intersect_num++;
                intersection_found = true;
            }
        }
        else // If determinant < 0, no intersect
            ;	// Do nothing
    }
    //look for intersection with smallest dist and return true
    if (intersection_found)
    {
        // Find the intersection with the smallest distance
        intersect = intersectList[0];
        for (int j = 1; j < intersect_num; j++)
        {
            // Start from 1 because intersect.dist populated with intersectList[0].dist initially
            if (intersectList[j].dist < intersect.dist)
            {
                intersect = intersectList[j];
            }
        }
        return true;
    }
    else
        return false;
}

// Detect shadow

bool shadowExist(const Ray &shadowRay, const Intersect &intersect, float dist_light)
{
    Intersect shadowIntersect;
    
    // For every sphere, detect intersection and save shortest distance to shadowRay origin
    if (intersectRay(shadowRay, shadowIntersect)) {
        // If intersect dist shorter than light distance, then return true
        if (shadowIntersect.dist < dist_light)
            return true;
        else
            return false;
    }
    return false;   // if no intersects detected
}

// -------------------------------------------------------------------
// Ray tracing

vec4 trace(const Ray& ray, bool &sphereFound, int recurseDepth = g_recurse)
{
    // TODO: implement your ray tracing routine here.
    
    Intersect intersect;
    Sphere *targetSphere;
    Ray reflectLight;    // Reflection of light ray
    Ray reflectViewer;   // Reflection of viewer ray
    Ray shadow;
    vec4 light_dir;
    vec4 color_total;
    vec3 color_a = vec3();          // ambient
    vec3 color_d = vec3();          // diffuse
    vec3 color_s = vec3();          //specular
    vec3 color_l = vec3();          //local
    vec4 color_r = vec4(0.0f, 0.0f, 0.0f, 1.0f);
    bool nextSphereFound = false;  // Used to detect if reflect color is valid for tracing reflectRay
    
    // Find intersection of ray for each sphere and pass back 'intersect' var with intersection closest to camera
    if (!intersectRay(ray, intersect))
    {  // If no intersection then assign background color to pixel
        sphereFound = false;
        return vec4(g_background);
    }
    else {
        // Intersection found
        sphereFound = true;
        // Get sphere based off intersection
        targetSphere = &spheres[intersect.sphere_num];
        
        // Find outgoing (reflected) ray based off incoming ray and intersect normal
        reflectLight.origin = intersect.pt_pos;
        reflectViewer.origin = intersect.pt_pos;
        reflectViewer.dir = normalize(ray.dir - 2 * dot(ray.dir, intersect.vec_norm) * intersect.vec_norm);
        
        for (int p = 0; p < light_index; p++)
        {
            // Get light direction from intersect point (normalized)
            light_dir = normalize(lights[p].origin - intersect.pt_pos);
            
            // Find reflection direction of point light (to be used later for specular component)
            reflectLight.dir = normalize(2 * dot(light_dir, intersect.vec_norm) * intersect.vec_norm - light_dir);
            
            // Determine shadowRay specific to point light
            shadow.dir = light_dir;
            shadow.origin = intersect.pt_pos;
            
            // If dot product of intersect normal and shadowRay direction is negative, then object shadowing itself
            if (dot(shadow.dir, intersect.vec_norm) < 0)
                ;
            else{
                // Find distance from light origin to shadowRay origin
                float dist_light = length(lights[p].origin - shadow.origin);
                
                if (!shadowExist(shadow, intersect, dist_light))
                {
                    // If intersection not in shadow, light contributes color
                    // Sum up diffuse and specular components for each point light
                    if (dot(intersect.vec_norm, light_dir) > 0)
                    {
                        // Only add diffuse component if diffuse dot product is positive
                        color_d += targetSphere->k_d * lights[p].rgb * dot(intersect.vec_norm, light_dir) * targetSphere->rgb;
                        if (dot(reflectLight.dir, -ray.dir) > 0)
                            // Only add specular component if both diffuse and specular dot product are positive
                            color_s += targetSphere->k_s * lights[p].rgb * pow(dot(reflectLight.dir, -ray.dir), targetSphere->shine);  // Need to normalize V before dotting with R
                    }
                }
            }
        }
        color_a = targetSphere->k_a * (targetSphere->rgb * g_ambient);
        color_l = color_a + color_d + color_s;
        
        // Recursive call trace to find color_reflected
        if (recurseDepth > 0) {
            color_r = trace(reflectViewer, nextSphereFound, recurseDepth - 1);
            if (!nextSphereFound)
                // If no object found from reflect trace, then set color_reflect to 0 (so we don't use background color)
                color_r = vec4(0.0f, 0.0f, 0.0f, 1.0f);
        }
        // Add up colors and scale color_reflected by sphere's K_r
        color_total = vec4(color_l) + targetSphere->k_r * color_r;
        return color_total;
    }
}

vec4 getDir(int ix, int iy)
{
    // TODO: modify this. This should return the direction from the origin
    // to pixel (ix, iy), normalized.
    vec4 dir;
    float pt_x;
    float pt_y;
    float pt_z;
    pt_x = g_left + 2 * g_right*((float)ix / (g_width-1));	// iterate from pixel 0 to res_x-1
    pt_y = g_bottom + 2 * g_top*((float)iy / (g_height-1));	// iterate from pixel 0 to res_y-1
    pt_z = -g_near;
    
    dir = normalize(vec4(pt_x, pt_y, pt_z, 0.0f));
    return dir;
}

void renderPixel(int ix, int iy)
{
    Ray ray;
    bool objFound = false;
    ray.origin = vec4(0.0f, 0.0f, 0.0f, 1.0f);
    ray.dir = getDir(ix, iy);
    vec4 color = trace(ray, objFound);
    setColor(ix, iy, color);
}

void render()
{
    for (int iy = 0; iy < g_height; iy++)
        for (int ix = 0; ix < g_width; ix++)
            renderPixel(ix, iy);
}


// -------------------------------------------------------------------
// PPM saving

void savePPM(int Width, int Height, char* fname, unsigned char* pixels) 
{
    FILE *fp;
    const int maxVal=255;

    printf("Saving image %s: %d x %d\n", fname, Width, Height);
    fp = fopen(fname,"wb");
    if (!fp) {
        printf("Unable to open file '%s'\n", fname);
        return;
    }
    fprintf(fp, "P6\n");
    fprintf(fp, "%d %d\n", Width, Height);
    fprintf(fp, "%d\n", maxVal);

    for(int j = 0; j < Height; j++) {
        fwrite(&pixels[j*Width*3], 3, Width, fp);
    }

    fclose(fp);
}

void saveFile()
{
    float temp;
    // Convert color components from floats to unsigned chars.
    // TODO: clamp values if out of range.
    unsigned char* buf = new unsigned char[g_width * g_height * 3];
    for (int y = 0; y < g_height; y++)
        for (int x = 0; x < g_width; x++)
            for (int i = 0; i < 3; i++)
            {		// Go through r, g, b values (skip alpha channel)
                temp = ((float*)g_colors[y*g_width + x])[i];
                temp = (temp > 1 ? 1 : temp);   // Clamp color to 1 max
                buf[y*g_width*3 + x*3 + i] = (unsigned char)(temp * 255.9f);
            }
    
    // TODO: change file name based on input file name.
    savePPM(g_width, g_height, outPut, buf);
    delete[] buf;
    free(outPut);  // Free memory we used malloc for initially}
}

// -------------------------------------------------------------------
// Main

int main(int argc, char* argv[])
{
    if (argc < 2)
    {
        cout << "Usage: template-rt <input_file.txt>" << endl;
        exit(1);
    }
    loadFile(argv[1]);
    render();
    saveFile();
	return 0;
}
